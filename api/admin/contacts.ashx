<%@ WebHandler Language="C#" Class="AdminContactsHandler" %>
using System;
using System.Web;
public class ContactAction{public long id{get;set;}public string action{get;set;}public string answer{get;set;}}
public class AdminContactsHandler:IHttpHandler
{
 public bool IsReusable{get{return false;}}
 public void ProcessRequest(HttpContext c){WebJson.Init(c);try{
 AdminAuthorizationResult a=WebJson.Admin(c);if(a==null)return;
 if(c.Request.HttpMethod=="GET"){int page,total;if(!int.TryParse(c.Request["page"],out page)||page<1)page=1;var items=RepositorioConsultasWeb.Listar(c.Request["q"],c.Request["state"]??"",page,out total);WebJson.Send(c,200,new{success=true,items=items,total=total,page=page,csrfToken=AdminCsrfProtection.EnsureToken(c)});return;}
 if(!WebJson.Post(c))return;ContactAction req=WebJson.Read<ContactAction>(c);if(req==null||req.id<1)throw new InvalidOperationException("Consulta inválida.");
 if(req.action!="resend")RepositorioConsultasWeb.Gestionar(a.Usuario.IdUsuario,req.id,req.action,req.answer);
 bool sent=req.action=="delete"||RepositorioConsultasWeb.EnviarRespuesta(req.id);
 WebJson.Send(c,200,new{success=true,mailSent=sent,message=req.action=="delete"?"Consulta eliminada.":sent?"Respuesta guardada y correo enviado.":"Respuesta guardada. El correo no se envió; revisa SMTP y usa Reintentar correo."});
 }catch(InvalidOperationException ex){WebJson.Send(c,400,new{success=false,message=ex.Message});}catch{WebJson.Send(c,500,new{success=false,message="No fue posible completar la operación. Actualiza la bandeja para verificar el estado."});}}
}
