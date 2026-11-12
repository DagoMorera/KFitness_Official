<%@ WebHandler Language="C#" Class="RoutinesProgressHandler" %>
using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
public class RoutineProgressRequest
{
 public string action {get;set;}
 public long assignmentId {get;set;}
 public int sessionId {get;set;}
 public long executionId {get;set;}
 public long exerciseId {get;set;}
 public bool completed {get;set;}
 public bool confirmIncomplete {get;set;}
}
public class RoutinesProgressHandler : IHttpHandler
{
 public bool IsReusable {get{return false;}}
 public void ProcessRequest(HttpContext context)
 {
  context.Response.ContentType="application/json; charset=utf-8";
  context.Response.ContentEncoding=System.Text.Encoding.UTF8;
  context.Response.SuppressFormsAuthenticationRedirect=true;
  context.Response.TrySkipIisCustomErrors=true;
  context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
  JavaScriptSerializer js=new JavaScriptSerializer();
  try
  {
   AdminAuthorizationResult auth=AdminAuthorization.ValidateCurrentUser(context);
   if(!auth.IsAuthenticated){context.Response.StatusCode=401;context.Response.Write(js.Serialize(new{success=false,message="Inicia sesión para continuar."}));return;}
   if(!auth.UserExists || !string.Equals(auth.RolNombre,"Cliente",StringComparison.OrdinalIgnoreCase)){context.Response.StatusCode=403;context.Response.Write(js.Serialize(new{success=false,message="Acceso exclusivo para clientes."}));return;}
   if(context.Request.HttpMethod!="POST"){context.Response.StatusCode=405;context.Response.Write(js.Serialize(new{success=false,message="Método no permitido."}));return;}
   if(!AdminCsrfProtection.EsSolicitudPostValida(context)){context.Response.StatusCode=403;context.Response.Write(js.Serialize(new{success=false,message="Actualiza la página para renovar el token de seguridad."}));return;}
   if(context.Request.ContentLength>16384)throw new InvalidOperationException("Solicitud demasiado grande.");
   RoutineProgressRequest req;
   try{req=js.Deserialize<RoutineProgressRequest>(new StreamReader(context.Request.InputStream).ReadToEnd());}
   catch{throw new InvalidOperationException("Solicitud inválida.");}
   if(req==null || req.assignmentId<=0)throw new InvalidOperationException("Asignación inválida.");
   long id=RepositorioRutinasProgreso.Actualizar(auth.Usuario.IdUsuario,req.assignmentId,req.sessionId,req.executionId,req.exerciseId,req.action,req.completed,req.confirmIncomplete);
   context.Response.Write(js.Serialize(new{success=true,executionId=id}));
  }
  catch(InvalidOperationException ex){context.Response.StatusCode=409;context.Response.Write(js.Serialize(new{success=false,message=ex.Message}));}
  catch{context.Response.StatusCode=500;context.Response.Write(js.Serialize(new{success=false,message="No fue posible guardar el progreso. Vuelve a cargar la vista antes de reintentar."}));}
 }
}
