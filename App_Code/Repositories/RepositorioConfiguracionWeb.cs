using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Net.Mail;
public static class RepositorioConfiguracionWeb
{
 public static readonly string[] Keys={"Nombre","Telefono","Correo","Direccion","Descripcion","ReservasHabilitadas"};
 public static Dictionary<string,string> Obtener()
 {
  Dictionary<string,string> d=new Dictionary<string,string>{{"Nombre","KFitness"},{"Telefono","+506 7012 4477"},{"Correo","karinamartinezg19@gmail.com"},{"Direccion",""},{"Descripcion","Entrenamiento y bienestar integral."},{"ReservasHabilitadas","true"}};
  using(SqlConnection c=DbHelper.GetConnection())using(SqlCommand q=new SqlCommand("SELECT Clave,Valor FROM cfg.Parametros WHERE Modulo=N'Web' AND Activo=1 AND Clave LIKE N'WEB.%'",c))
  {c.Open();using(SqlDataReader r=q.ExecuteReader())while(r.Read()){string key=r.GetString(0).Substring(4);if(d.ContainsKey(key))d[key]=r.GetString(1);}}
  return d;
 }
 public static void Guardar(int actor,Dictionary<string,string> d)
 {
  if(d==null)throw new InvalidOperationException("Configuración inválida.");
  foreach(string key in Keys)if(!d.ContainsKey(key)||d[key]==null||d[key].Length>500)throw new InvalidOperationException("Revisa los campos de configuración.");
  if(string.IsNullOrWhiteSpace(d["Nombre"])||string.IsNullOrWhiteSpace(d["Telefono"])||string.IsNullOrWhiteSpace(d["Correo"]))throw new InvalidOperationException("Nombre, teléfono y correo son obligatorios.");
  try{if(new MailAddress(d["Correo"]).Address!=d["Correo"].Trim())throw new FormatException();}catch{throw new InvalidOperationException("Correo inválido.");}
  bool enabled;if(!bool.TryParse(d["ReservasHabilitadas"],out enabled))throw new InvalidOperationException("Regla de reservas inválida.");
  using(SqlConnection c=DbHelper.GetConnection())
  {c.Open();using(SqlTransaction tx=c.BeginTransaction(IsolationLevel.Serializable)){
   foreach(string key in Keys)using(SqlCommand q=new SqlCommand(@"UPDATE cfg.Parametros WITH (UPDLOCK,HOLDLOCK) SET Valor=@v,Activo=1,FechaModificacion=SYSDATETIME(),ModificadoPor=@u WHERE Clave=@k;
IF @@ROWCOUNT=0 INSERT cfg.Parametros(Clave,Valor,TipoDato,Modulo,CreadoPor) VALUES(@k,@v,@t,N'Web',@u);",c,tx))
   {q.Parameters.AddWithValue("@k","WEB."+key);q.Parameters.AddWithValue("@v",d[key].Trim());q.Parameters.AddWithValue("@u",actor);q.Parameters.AddWithValue("@t",key=="ReservasHabilitadas"?"BOOLEANO":"TEXTO");q.ExecuteNonQuery();}tx.Commit();}}
  RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest{Modulo="Configuración",Accion="Actualizar",IdUsuario=actor,Entidad="cfg.Parametros",Descripcion="Actualización de información pública y regla de reservas."});
 }
}
