<%@ WebHandler Language="C#" Class="AdminNotificationsHandler" %>
using System;
using System.Web;
public class AdminNotificationsHandler:IHttpHandler
{
 public bool IsReusable{get{return false;}}
 public void ProcessRequest(HttpContext c){WebJson.Init(c);try{if(WebJson.Admin(c)==null)return;if(c.Request.HttpMethod=="GET"){WebJson.Send(c,200,new{success=true,pending=CorreosWeb.Pendientes(),csrfToken=AdminCsrfProtection.EnsureToken(c)});return;}if(!WebJson.Post(c))return;int sent=CorreosWeb.Reintentar();WebJson.Send(c,200,new{success=true,pending=CorreosWeb.Pendientes(),sent=sent});}catch{WebJson.Send(c,500,new{success=false,message="No fue posible consultar la cola de correos. Revisa la migración 027 y la configuración SMTP."});}}
}
