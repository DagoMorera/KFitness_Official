using System;
using System.Data;
using System.Data.SqlClient;
public static class CorreosWeb
{
 public static void Notificar(string key,string email,string subject,string body)
 {
  try {
   long id;
   using(SqlConnection c=DbHelper.GetConnection()){c.Open();using(SqlTransaction tx=c.BeginTransaction(IsolationLevel.Serializable))
   using(SqlCommand q=new SqlCommand(@"IF NOT EXISTS(SELECT 1 FROM ntf.CorreosWeb WITH(UPDLOCK,HOLDLOCK) WHERE ClaveEvento=@k)
INSERT ntf.CorreosWeb(ClaveEvento,Destino,Asunto,Cuerpo) VALUES(@k,@d,@a,@b);
SELECT IdCorreo FROM ntf.CorreosWeb WHERE ClaveEvento=@k;",c,tx))
   {q.Parameters.AddWithValue("@k",key);q.Parameters.AddWithValue("@d",email);q.Parameters.AddWithValue("@a",subject);q.Parameters.AddWithValue("@b",body);id=Convert.ToInt64(q.ExecuteScalar());tx.Commit();}}
   Enviar(id);
  } catch {RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest{Modulo="Notificaciones",Accion="Error",Descripcion="No se pudo procesar un correo transaccional. Revisar configuración y cola."});}
 }
 public static bool Enviar(long id)
 {
  using(SqlConnection c=DbHelper.GetConnection()){
   c.Open();using(SqlCommand q=new SqlCommand("DECLARE @r int;EXEC @r=sp_getapplock @Resource=@k,@LockMode='Exclusive',@LockOwner='Session',@LockTimeout=0;SELECT @r;",c))
   {q.Parameters.AddWithValue("@k","correo-web-"+id);if(Convert.ToInt32(q.ExecuteScalar())<0)return false;}
   try {
    string email,subject,body;
    using(SqlCommand q=new SqlCommand("SELECT Destino,Asunto,Cuerpo FROM ntf.CorreosWeb WHERE IdCorreo=@id AND Enviado=0",c))
    {q.Parameters.AddWithValue("@id",id);using(SqlDataReader r=q.ExecuteReader()){if(!r.Read())return true;email=r.GetString(0);subject=r.GetString(1);body=r.GetString(2);}}
    using(SqlCommand q=new SqlCommand("UPDATE ntf.CorreosWeb SET Intentos=Intentos+1 WHERE IdCorreo=@id",c)){q.Parameters.AddWithValue("@id",id);q.ExecuteNonQuery();}
    SmtpRecoveryMailer.EnviarTexto(email,subject,body);
    using(SqlCommand q=new SqlCommand("UPDATE ntf.CorreosWeb SET Enviado=1,FechaEnvio=SYSUTCDATETIME() WHERE IdCorreo=@id",c)){q.Parameters.AddWithValue("@id",id);q.ExecuteNonQuery();}return true;
   }
   catch(System.Net.Mail.SmtpException){return false;}
   catch(InvalidOperationException){return false;}
   finally{using(SqlCommand q=new SqlCommand("EXEC sp_releaseapplock @Resource=@k,@LockOwner='Session'",c)){q.Parameters.AddWithValue("@k","correo-web-"+id);q.ExecuteNonQuery();}}
  }
 }
 public static int Pendientes(){using(SqlConnection c=DbHelper.GetConnection())using(SqlCommand q=new SqlCommand("SELECT COUNT(*) FROM ntf.CorreosWeb WHERE Enviado=0",c)){c.Open();return Convert.ToInt32(q.ExecuteScalar());}}
 public static int Reintentar(){var ids=new System.Collections.Generic.List<long>();using(SqlConnection c=DbHelper.GetConnection())using(SqlCommand q=new SqlCommand("SELECT TOP(5) IdCorreo FROM ntf.CorreosWeb WHERE Enviado=0 ORDER BY IdCorreo",c)){c.Open();using(SqlDataReader r=q.ExecuteReader())while(r.Read())ids.Add(r.GetInt64(0));}int sent=0;foreach(long id in ids)if(Enviar(id))sent++;return sent;}
}
