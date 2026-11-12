<%@ WebHandler Language="C#" Class="AuthStatusHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;

public class AuthStatusResponse
{
    public bool isAuthenticated { get; set; }
    public string identityName { get; set; }
    public string requestPath { get; set; }
    public string host { get; set; }
    public string scheme { get; set; }
    public bool authCookiePresent { get; set; }
}

public class AuthStatusHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        var js = new JavaScriptSerializer();

        try
        {
            var req = context.Request;
            bool cookiePresent = req.Cookies[System.Web.Security.FormsAuthentication.FormsCookieName] != null;

            var resp = new AuthStatusResponse();
            resp.isAuthenticated = (context.User != null && context.User.Identity != null && context.User.Identity.IsAuthenticated);
            resp.identityName = resp.isAuthenticated ? context.User.Identity.Name : null;
            resp.requestPath = req.Path;
            resp.host = req.Url.Host;
            resp.scheme = req.Url.Scheme;
            resp.authCookiePresent = cookiePresent;

            // If not authenticated, ensure we do not return login.html due to FormsAuth redirect when called via fetch
            if (!resp.isAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
            }

            context.Response.Write(js.Serialize(resp));
        }
        catch (Exception)
        {
            context.Response.StatusCode = 500;
            context.Response.Write(new JavaScriptSerializer().Serialize(new { error = "Error interno" }));
        }
    }
}
