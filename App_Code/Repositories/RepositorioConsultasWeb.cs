using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Net.Mail;
public class ConsultaWeb
{
 public long IdConsulta{get;set;} public string Nombre{get;set;} public string Correo{get;set;} public string Telefono{get;set;}
 public string Asunto{get;set;} public string Mensaje{get;set;} public string Estado{get;set;} public string Respuesta{get;set;}
 public string Fecha{get;set;} public bool CorreoEnviado{get;set;} public string ClaveSolicitud{get;set;}
}
public static class RepositorioConsultasWeb
{
 public static long Crear(ConsultaWeb d, bool requiereTelefono = true)
 {
  if(d==null||string.IsNullOrWhiteSpace(d.Nombre)||d.Nombre.Length>(requiereTelefono ? 150 : 302)||string.IsNullOrWhiteSpace(d.Correo)||d.Correo.Length>256||(requiereTelefono && string.IsNullOrWhiteSpace(d.Telefono))||(d.Telefono??"").Length>30||string.IsNullOrWhiteSpace(d.Asunto)||d.Asunto.Length>200||string.IsNullOrWhiteSpace(d.Mensaje)||d.Mensaje.Length>4000)throw new InvalidOperationException(requiereTelefono ? "Completa nombre, correo, teléfono, asunto y mensaje con los tamaños permitidos." : "Completa el asunto y el mensaje con los tamaños permitidos.");
  try{if(new MailAddress(d.Correo).Address!=d.Correo.Trim())throw new FormatException();}catch{throw new InvalidOperationException("Introduce un correo electrónico válido.");}
  Guid key;if(!Guid.TryParse(d.ClaveSolicitud,out key))throw new InvalidOperationException("Recarga el formulario antes de enviar.");
  using(SqlConnection c=DbHelper.GetConnection())
  {c.Open();using(SqlTransaction tx=c.BeginTransaction(IsolationLevel.Serializable)){
   using(SqlCommand q=new SqlCommand("SELECT IdConsulta FROM con.Consultas WITH (UPDLOCK,HOLDLOCK) WHERE ClaveSolicitud=@k",c,tx))
   {q.Parameters.AddWithValue("@k",key);object id=q.ExecuteScalar();if(id!=null){tx.Commit();return Convert.ToInt64(id);}}
   using(SqlCommand q=new SqlCommand("SELECT COUNT(*) FROM con.Consultas WHERE Correo=@c AND FechaCreacion>DATEADD(hour,-1,SYSUTCDATETIME())",c,tx))
   {q.Parameters.AddWithValue("@c",d.Correo.Trim());if(Convert.ToInt32(q.ExecuteScalar())>=5)throw new InvalidOperationException("Has enviado varias consultas. Intenta más tarde.");}
   using(SqlCommand q=new SqlCommand(@"INSERT con.Consultas(Nombre,Correo,Telefono,Asunto,Mensaje,ClaveSolicitud) VALUES(@n,@c,@t,@a,@m,@k);SELECT CAST(SCOPE_IDENTITY() AS BIGINT);",c,tx))
   {q.Parameters.AddWithValue("@n",d.Nombre.Trim());q.Parameters.AddWithValue("@c",d.Correo.Trim());q.Parameters.AddWithValue("@t",(d.Telefono??"").Trim());q.Parameters.AddWithValue("@a",d.Asunto.Trim());q.Parameters.AddWithValue("@m",d.Mensaje.Trim());q.Parameters.AddWithValue("@k",key);long id=Convert.ToInt64(q.ExecuteScalar());tx.Commit();return id;}
  }}
 }
 public static List<ConsultaWeb> Listar(string search,string state,int page,out int total)
 {
  if(state!=""&&state!="Pendiente"&&state!="Respondida")throw new InvalidOperationException("Estado inválido.");
  if(page<1)page=1;
  List<ConsultaWeb> items=new List<ConsultaWeb>();
  using(SqlConnection c=DbHelper.GetConnection())
  using(SqlCommand q=new SqlCommand(@"SELECT COUNT(*) FROM con.Consultas WHERE (@s='' OR Estado=@s) AND Nombre LIKE '%'+@q+'%';
SELECT IdConsulta,Nombre,Correo,Telefono,Asunto,Mensaje,Estado,Respuesta,FechaCreacion,CorreoEnviado FROM con.Consultas
WHERE (@s='' OR Estado=@s) AND Nombre LIKE '%'+@q+'%' ORDER BY FechaCreacion DESC,IdConsulta DESC OFFSET @offset ROWS FETCH NEXT 10 ROWS ONLY;",c))
  {
   q.Parameters.AddWithValue("@s",state);q.Parameters.AddWithValue("@q",(search??"").Trim());q.Parameters.AddWithValue("@offset",(page-1)*10);c.Open();
   using(SqlDataReader r=q.ExecuteReader()){r.Read();total=r.GetInt32(0);r.NextResult();while(r.Read())items.Add(new ConsultaWeb{IdConsulta=r.GetInt64(0),Nombre=r.GetString(1),Correo=r.GetString(2),Telefono=r.GetString(3),Asunto=r.GetString(4),Mensaje=r.GetString(5),Estado=r.GetString(6),Respuesta=r.IsDBNull(7)?null:r.GetString(7),Fecha=r.GetDateTime(8).ToString("yyyy-MM-ddTHH:mm:ssZ"),CorreoEnviado=r.GetBoolean(9)});}
  }return items;
 }
 public static void Gestionar(int actor,long id,string action,string answer)
 {
  if(action!="delete"&&action!="answer")throw new InvalidOperationException("Acción inválida.");
  if(action=="answer"&&(string.IsNullOrWhiteSpace(answer)||answer.Length>4000))throw new InvalidOperationException("Debe ingresar una nota de resolución (máximo 4000 caracteres).");
  string sql=action=="delete"?"DELETE con.Consultas WHERE IdConsulta=@id":"UPDATE con.Consultas SET Respuesta=@r,Estado=N'Respondida',FechaRespuesta=SYSUTCDATETIME(),IdUsuarioRespuesta=@u WHERE IdConsulta=@id AND Estado=N'Pendiente'";
  using(SqlConnection c=DbHelper.GetConnection())using(SqlCommand q=new SqlCommand(sql,c)){q.Parameters.AddWithValue("@id",id);q.Parameters.AddWithValue("@r",(object)answer??DBNull.Value);q.Parameters.AddWithValue("@u",actor);c.Open();if(q.ExecuteNonQuery()!=1)throw new InvalidOperationException("La consulta no existe o ya fue respondida. Actualiza la bandeja.");}
  RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest{Modulo="Consultas",Accion=action=="delete"?"Eliminar":"Responder",IdUsuario=actor,Entidad="con.Consultas",IdRegistro=id.ToString(),Descripcion="Gestión de consulta pública."});
 }
 public static bool EnviarRespuesta(long id)
 {
  using(SqlConnection c=DbHelper.GetConnection())
  {
   c.Open();using(SqlCommand gate=new SqlCommand("DECLARE @r int;EXEC @r=sp_getapplock @Resource=@key,@LockMode='Exclusive',@LockOwner='Session',@LockTimeout=0;SELECT @r;",c))
   {gate.Parameters.AddWithValue("@key","consulta-correo-"+id);if(Convert.ToInt32(gate.ExecuteScalar())<0)return false;}
   try {
    string email,answer,subject;bool sent;
    using(SqlCommand q=new SqlCommand("SELECT Correo,Respuesta,Asunto,CorreoEnviado FROM con.Consultas WHERE IdConsulta=@id AND Estado=N'Respondida'",c))
    {q.Parameters.AddWithValue("@id",id);using(SqlDataReader r=q.ExecuteReader()){if(!r.Read())throw new InvalidOperationException("La consulta no tiene respuesta guardada.");email=r.GetString(0);answer=r.GetString(1);subject=r.GetString(2);sent=r.GetBoolean(3);}}
    if(sent)return true;
    SmtpRecoveryMailer.EnviarTexto(email,"KFitness · Respuesta a tu consulta",subject+"\n\n"+answer);
    using(SqlCommand q=new SqlCommand("UPDATE con.Consultas SET CorreoEnviado=1 WHERE IdConsulta=@id",c)){q.Parameters.AddWithValue("@id",id);q.ExecuteNonQuery();}return true;
   }
   catch(System.Net.Mail.SmtpException){return false;}
   catch(InvalidOperationException){return false;}
   finally{using(SqlCommand q=new SqlCommand("EXEC sp_releaseapplock @Resource=@key,@LockOwner='Session'",c)){q.Parameters.AddWithValue("@key","consulta-correo-"+id);q.ExecuteNonQuery();}}
  }
 }
}
