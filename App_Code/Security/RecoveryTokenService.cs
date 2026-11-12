using System;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Configuration;

public class RecoveryTokenPayload
{
    public string TokenPlano { get; set; }
    public string TokenHash { get; set; }
    public DateTime FechaExpiraUtc { get; set; }
}

public static class RecoveryTokenService
{
    private const int TokenBytesLength = 32;
    private const int VigenciaMinutos = 30;

    public static RecoveryTokenPayload GenerarToken()
    {
        byte[] randomBytes = new byte[TokenBytesLength];
        using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider())
        {
            rng.GetBytes(randomBytes);
        }

        string tokenPlano = ToBase64Url(randomBytes);
        string tokenHash = CalcularHashToken(tokenPlano);

        RecoveryTokenPayload payload = new RecoveryTokenPayload();
        payload.TokenPlano = tokenPlano;
        payload.TokenHash = tokenHash;
        payload.FechaExpiraUtc = DateTime.UtcNow.AddMinutes(VigenciaMinutos);
        return payload;
    }

    public static string CalcularHashToken(string tokenPlano)
    {
        if (string.IsNullOrWhiteSpace(tokenPlano))
        {
            throw new ArgumentException("Token inválido.", "tokenPlano");
        }

        byte[] tokenBytes = Encoding.UTF8.GetBytes(tokenPlano.Trim());
        using (SHA256 sha = SHA256.Create())
        {
            byte[] hash = sha.ComputeHash(tokenBytes);
            return Convert.ToBase64String(hash);
        }
    }

    public static string ConstruirEnlaceRecuperacion(string tokenPlano)
    {
        if (string.IsNullOrWhiteSpace(tokenPlano))
        {
            throw new ArgumentException("Token inválido.", "tokenPlano");
        }

        string publicBaseUrl = ConfigurationManager.AppSettings["PublicAppBaseUrl"];
        if (string.IsNullOrWhiteSpace(publicBaseUrl))
        {
            string envBaseUrl = Environment.GetEnvironmentVariable("PublicAppBaseUrl");
            if (!string.IsNullOrWhiteSpace(envBaseUrl))
            {
                publicBaseUrl = envBaseUrl.Trim();
            }
        }
        if (string.IsNullOrWhiteSpace(publicBaseUrl))
        {
            throw new InvalidOperationException("Falta configurar PublicAppBaseUrl.");
        }

        Uri baseUri;
        if (!Uri.TryCreate(publicBaseUrl.Trim(), UriKind.Absolute, out baseUri))
        {
            throw new InvalidOperationException("PublicAppBaseUrl no es una URL válida.");
        }

        if (!string.Equals(baseUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("PublicAppBaseUrl debe usar HTTPS.");
        }

        string resetPath = ConfigurationManager.AppSettings["ResetPasswordPath"];
        if (string.IsNullOrWhiteSpace(resetPath))
        {
            resetPath = "/restablecer-contrasena.html";
        }

        if (!resetPath.StartsWith("/"))
        {
            resetPath = "/" + resetPath;
        }

        UriBuilder builder = new UriBuilder(baseUri);
        builder.Path = resetPath;
        builder.Query = "token=" + HttpUtility.UrlEncode(tokenPlano);
        return builder.Uri.AbsoluteUri;
    }

    private static string ToBase64Url(byte[] input)
    {
        string base64 = Convert.ToBase64String(input);
        base64 = base64.Split('=')[0];
        base64 = base64.Replace('+', '-');
        base64 = base64.Replace('/', '_');
        return base64;
    }
}