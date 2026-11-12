using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
public static class WebJson
{
 public static void Init(HttpContext c){c.Response.ContentType="application/json; charset=utf-8";c.Response.ContentEncoding=System.Text.Encoding.UTF8;c.Response.TrySkipIisCustomErrors=true;c.Response.SuppressFormsAuthenticationRedirect=true;c.Response.Cache.SetCacheability(HttpCacheability.NoCache);}
 public static void Send(HttpContext c,int code,object data){c.Response.StatusCode=code;c.Response.Write(new JavaScriptSerializer().Serialize(data));}
 public static T Read<T>(HttpContext c){if(c.Request.ContentLength>32768)throw new InvalidOperationException("Solicitud demasiado extensa.");try{return new JavaScriptSerializer().Deserialize<T>(new StreamReader(c.Request.InputStream).ReadToEnd());}catch{throw new InvalidOperationException("Solicitud inválida.");}}
 public static AdminAuthorizationResult Admin(HttpContext c)
 {
  AdminAuthorizationResult a=AdminAuthorization.ValidateCurrentUser(c);
  if(!a.IsAuthenticated){Send(c,401,new{success=false,message="Inicia sesión para continuar."});return null;}
  if(!a.IsAdmin||!a.UserExists){Send(c,403,new{success=false,message="Acceso denegado."});return null;}return a;
 }
 public static bool Post(HttpContext c)
 {
  if(c.Request.HttpMethod!="POST"){Send(c,405,new{success=false,message="Método no permitido."});return false;}
  if(!AdminCsrfProtection.EsSolicitudPostValida(c)){Send(c,403,new{success=false,message="Actualiza la página para renovar el token de seguridad."});return false;}return true;
 }
}
