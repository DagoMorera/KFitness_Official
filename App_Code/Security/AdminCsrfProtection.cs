using System;
using System.Security.Cryptography;
using System.Web;

public static class AdminCsrfProtection
{
    private const string CsrfCookieName = "kf_admin_csrf";
    private const string CsrfHeaderName = "X-CSRF-Token";

    public static string EnsureToken(HttpContext context)
    {
        if (context == null) return null;

        string token = ObtenerTokenCookie(context);
        if (!string.IsNullOrWhiteSpace(token))
        {
            return token;
        }

        token = GenerarTokenSeguro();
        HttpCookie cookie = new HttpCookie(CsrfCookieName, token);
        cookie.HttpOnly = false;
        cookie.Secure = context.Request != null && context.Request.IsSecureConnection;
        cookie.Path = "/";
        cookie.SameSite = SameSiteMode.Strict;
        context.Response.Cookies.Set(cookie);

        return token;
    }

    public static bool EsSolicitudPostValida(HttpContext context)
    {
        if (context == null || context.Request == null) return false;

        if (!EsMismoOrigen(context))
        {
            return false;
        }

        string tokenCookie = ObtenerTokenCookie(context);
        if (string.IsNullOrWhiteSpace(tokenCookie))
        {
            return false;
        }

        string tokenHeader = context.Request.Headers[CsrfHeaderName];
        if (string.IsNullOrWhiteSpace(tokenHeader))
        {
            return false;
        }

        tokenHeader = tokenHeader.Trim();
        tokenCookie = tokenCookie.Trim();

        return FixedTimeEquals(tokenHeader, tokenCookie);
    }

    public static bool EsMismoOrigen(HttpContext context)
    {
        if (context == null || context.Request == null || context.Request.Url == null) return false;

        Uri requestUrl = context.Request.Url;
        bool encontroEncabezadoOrigen = false;

        string originHeader = context.Request.Headers["Origin"];
        if (!string.IsNullOrWhiteSpace(originHeader))
        {
            encontroEncabezadoOrigen = true;
            Uri origin;
            if (!Uri.TryCreate(originHeader, UriKind.Absolute, out origin))
            {
                return false;
            }

            if (!EsMismoHostProtocoloPuerto(requestUrl, origin))
            {
                return false;
            }
        }

        string refererHeader = context.Request.Headers["Referer"];
        if (!string.IsNullOrWhiteSpace(refererHeader))
        {
            encontroEncabezadoOrigen = true;
            Uri referer;
            if (!Uri.TryCreate(refererHeader, UriKind.Absolute, out referer))
            {
                return false;
            }

            if (!EsMismoHostProtocoloPuerto(requestUrl, referer))
            {
                return false;
            }
        }

        return encontroEncabezadoOrigen;
    }

    private static bool EsMismoHostProtocoloPuerto(Uri requestUrl, Uri other)
    {
        if (!string.Equals(requestUrl.Scheme, other.Scheme, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.Equals(requestUrl.Host, other.Host, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        int portA = requestUrl.IsDefaultPort ? PuertoPorDefecto(requestUrl.Scheme) : requestUrl.Port;
        int portB = other.IsDefaultPort ? PuertoPorDefecto(other.Scheme) : other.Port;

        return portA == portB;
    }

    private static int PuertoPorDefecto(string scheme)
    {
        if (string.Equals(scheme, "https", StringComparison.OrdinalIgnoreCase)) return 443;
        if (string.Equals(scheme, "http", StringComparison.OrdinalIgnoreCase)) return 80;
        return -1;
    }

    private static string ObtenerTokenCookie(HttpContext context)
    {
        if (context == null || context.Request == null) return null;
        HttpCookie cookie = context.Request.Cookies[CsrfCookieName];
        return cookie == null ? null : cookie.Value;
    }

    private static string GenerarTokenSeguro()
    {
        byte[] bytes = new byte[32];
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }

        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        if (left == null || right == null) return false;

        byte[] a = System.Text.Encoding.UTF8.GetBytes(left);
        byte[] b = System.Text.Encoding.UTF8.GetBytes(right);

        if (a.Length != b.Length) return false;

        int diff = 0;
        for (int i = 0; i < a.Length; i++)
        {
            diff |= a[i] ^ b[i];
        }

        return diff == 0;
    }
}