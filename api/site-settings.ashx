<%@ WebHandler Language="C#" Class="SiteSettingsHandler" %>
using System;
using System.Web;
public class SiteSettingsHandler:IHttpHandler
{
 public bool IsReusable{get{return false;}}
 public void ProcessRequest(HttpContext c){WebJson.Init(c);try{if(c.Request.HttpMethod!="GET"){WebJson.Send(c,405,new{success=false,message="Método no permitido."});return;}WebJson.Send(c,200,new{success=true,settings=RepositorioConfiguracionWeb.Obtener()});}catch{WebJson.Send(c,500,new{success=false,message="No fue posible consultar la información del gimnasio."});}}
}
