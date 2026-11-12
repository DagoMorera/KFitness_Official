<%@ WebHandler Language="C#" Class="AdminReportsExtraHandler" %>
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Globalization;
using System.Text;
using System.Web;
public class ReporteWebFila { public string fecha{get;set;} public string usuario{get;set;} public string detalle{get;set;} public string estado{get;set;} }
public class AdminReportsExtraHandler:IHttpHandler
{
 public bool IsReusable{get{return false;}}
 public void ProcessRequest(HttpContext c){WebJson.Init(c);try{
 if(WebJson.Admin(c)==null)return;
 if(c.Request.HttpMethod!="GET"){WebJson.Send(c,405,new{success=false,message="Método no permitido."});return;}
 DateTime? desde=Fecha(c.Request["desde"]),hasta=Fecha(c.Request["hasta"]);
 if(desde.HasValue&&hasta.HasValue&&desde>hasta)throw new InvalidOperationException("La fecha inicial no puede superar la final.");
 int page;if(!int.TryParse(c.Request["page"],out page)||page<1)page=1;
 bool export=c.Request["format"]=="csv";string kind=c.Request["type"]??"consultas",search=c.Request["q"]??"";
 List<ReporteWebFila> rows=new List<ReporteWebFila>();int total=0;
 if(kind=="consultas"){
 using(SqlConnection cn=DbHelper.GetConnection())using(SqlCommand q=new SqlCommand(@"SELECT COUNT(*) FROM con.Consultas WHERE (@d IS NULL OR FechaCreacion>=@d) AND (@h IS NULL OR FechaCreacion<DATEADD(day,1,@h)) AND (Nombre LIKE '%'+@q+'%' OR Correo LIKE '%'+@q+'%');
SELECT FechaCreacion,Nombre,Asunto,Estado FROM con.Consultas WHERE (@d IS NULL OR FechaCreacion>=@d) AND (@h IS NULL OR FechaCreacion<DATEADD(day,1,@h)) AND (Nombre LIKE '%'+@q+'%' OR Correo LIKE '%'+@q+'%') ORDER BY FechaCreacion DESC,IdConsulta DESC OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;",cn)){
 q.Parameters.AddWithValue("@d",(object)desde??DBNull.Value);q.Parameters.AddWithValue("@h",(object)hasta??DBNull.Value);q.Parameters.AddWithValue("@q",search);q.Parameters.AddWithValue("@offset",export?0:(page-1)*10);q.Parameters.AddWithValue("@size",export?10001:10);cn.Open();using(SqlDataReader r=q.ExecuteReader()){r.Read();total=r.GetInt32(0);r.NextResult();while(r.Read())rows.Add(new ReporteWebFila{fecha=r.GetDateTime(0).ToString("yyyy-MM-dd HH:mm"),usuario=r.GetString(1),detalle=r.GetString(2),estado=r.GetString(3)});}}
 }else if(kind=="actividad"){
 int current=export?1:page;do{AdminAuditoriaPaginada data=RepositorioAdmin.ObtenerBitacoraAuditoria(search,null,desde,hasta,current,export?100:10);if(!data.BitacoraDisponible)throw new InvalidOperationException("La bitácora no está disponible en esta base.");total=data.TotalRegistros;if(export&&total>10000)throw new InvalidOperationException("Reduce el período para exportar hasta 10000 registros.");foreach(AdminAuditoriaItem x in data.Eventos)rows.Add(new ReporteWebFila{fecha=x.Fecha.ToString("yyyy-MM-dd HH:mm"),usuario=x.Usuario,detalle=x.Modulo+" · "+x.Accion+" · "+x.Descripcion,estado=x.Resultado});current++;if(!export||rows.Count>=total||data.Eventos.Count==0)break;}while(true);
 }else throw new InvalidOperationException("Tipo de reporte inválido.");
 if(export){if(total>10000)throw new InvalidOperationException("Reduce el período para exportar hasta 10000 registros.");StringBuilder csv=new StringBuilder("Fecha,Usuario,Detalle,Estado\r\n");foreach(ReporteWebFila x in rows)csv.Append(Cell(x.fecha)+","+Cell(x.usuario)+","+Cell(x.detalle)+","+Cell(x.estado)+"\r\n");c.Response.ContentType="text/csv; charset=utf-8";c.Response.AddHeader("Content-Disposition","attachment; filename=KFitness-"+kind+".csv");c.Response.Write("\uFEFF"+csv.ToString());return;}
 WebJson.Send(c,200,new{success=true,rows=rows,total=total,page=page});
 }catch(InvalidOperationException ex){WebJson.Send(c,400,new{success=false,message=ex.Message});}catch{WebJson.Send(c,500,new{success=false,message="No fue posible generar el reporte."});}}
 private static DateTime? Fecha(string text){if(string.IsNullOrWhiteSpace(text))return null;DateTime value;if(!DateTime.TryParseExact(text,"yyyy-MM-dd",CultureInfo.InvariantCulture,DateTimeStyles.None,out value))throw new InvalidOperationException("Fecha inválida.");return value;}
 private static string Cell(string value){string s=value??"";if(s.Length>0&&"=+-@\t\r".IndexOf(s[0])>=0)s="'"+s;return "\""+s.Replace("\"","\"\"")+"\"";}
}
