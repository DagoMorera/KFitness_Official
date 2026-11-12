<%@ WebHandler Language="C#" Class="LogoutHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Security;

public class LogoutResponse {
    public bool success { get; set; }
}

public class LogoutHandler : IHttpHandler {
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context) {
        context.Response.ContentType = "application/json";
        var js = new JavaScriptSerializer();
        try {
            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase)) {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new LogoutResponse { success = false }));
                return;
            }

            try {
                FormsAuthentication.SignOut();
            } catch (Exception) {
                // ignore sign-out exceptions
            }

            context.Response.Write(js.Serialize(new LogoutResponse { success = true }));
        }
        catch (Exception) {
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new LogoutResponse { success = false }));
        }
    }
}
