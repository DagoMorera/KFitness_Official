<%@ WebHandler Language="C#" Class="AdminSiteSettingsHandler" %>
using System;
using System.Collections.Generic;
using System.Web;
public class AdminSiteSettingsHandler:IHttpHandler
{
 public bool IsReusable{get{return false;}}
 public void ProcessRequest(HttpContext c){WebJson.Init(c);try{AdminAuthorizationResult a=WebJson.Admin(c);if(a==null)return;if(c.Request.HttpMethod=="GET"){WebJson.Send(c,200,new{success=true,settings=RepositorioConfiguracionWeb.Obtener(),csrfToken=AdminCsrfProtection.EnsureToken(c)});return;}if(!WebJson.Post(c))return;RepositorioConfiguracionWeb.Guardar(a.Usuario.IdUsuario,WebJson.Read<Dictionary<string,string>>(c));WebJson.Send(c,200,new{success=true,message="Configuración actualizada."});}catch(InvalidOperationException ex){WebJson.Send(c,400,new{success=false,message=ex.Message});}catch{WebJson.Send(c,500,new{success=false,message="No fue posible guardar la configuración."});}}
}
