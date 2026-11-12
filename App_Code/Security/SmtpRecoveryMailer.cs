using System;
using System.Configuration;
using System.Net;
using System.Net.Mail;

public static class SmtpRecoveryMailer
{
    public static void EnviarCorreoRecuperacion(string correoDestino, string nombreDestino, string enlaceRecuperacion)
    {
        if (string.IsNullOrWhiteSpace(correoDestino))
        {
            throw new ArgumentException("Correo destino inválido.", "correoDestino");
        }

        if (string.IsNullOrWhiteSpace(enlaceRecuperacion))
        {
            throw new ArgumentException("Enlace de recuperación inválido.", "enlaceRecuperacion");
        }

        SmtpConfig config = CargarConfiguracion();

        string nombreSeguro = string.IsNullOrWhiteSpace(nombreDestino) ? "usuario" : nombreDestino.Trim();
        string asunto = "Recuperación de contraseña - KFitness";
        string body = ConstruirHtml(nombreSeguro, enlaceRecuperacion);

        MailMessage mensaje = new MailMessage();
        mensaje.From = new MailAddress(config.MailFromAddress, config.MailFromName);
        mensaje.To.Add(new MailAddress(correoDestino.Trim()));
        mensaje.Subject = asunto;
        mensaje.Body = body;
        mensaje.IsBodyHtml = true;

        using (SmtpClient client = new SmtpClient(config.SmtpHost, config.SmtpPort))
        {
            client.EnableSsl = config.SmtpEnableSsl;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(config.SmtpUser, config.SmtpPassword);
            client.Send(mensaje);
        }
    }

    public static void EnviarTexto(string destino, string asunto, string cuerpo)
    {
        SmtpConfig config = CargarConfiguracion();
        using (MailMessage message = new MailMessage())
        using (SmtpClient client = new SmtpClient(config.SmtpHost, config.SmtpPort))
        {
            message.From = new MailAddress(config.MailFromAddress, config.MailFromName);
            message.To.Add(new MailAddress(destino));
            message.Subject = asunto;
            message.Body = cuerpo;
            message.IsBodyHtml = false;
            message.BodyEncoding = System.Text.Encoding.UTF8;
            message.SubjectEncoding = System.Text.Encoding.UTF8;
            client.EnableSsl = config.SmtpEnableSsl;
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(config.SmtpUser, config.SmtpPassword);
            client.Timeout = 15000;
            client.Send(message);
        }
    }

    private static SmtpConfig CargarConfiguracion()
    {
        SmtpConfig config = new SmtpConfig();
        config.SmtpHost = ObtenerRequerido("SmtpHost");
        config.SmtpUser = ObtenerRequerido("SmtpUser");
        config.SmtpPassword = ObtenerRequerido("SmtpPassword");
        config.MailFromAddress = ObtenerRequerido("MailFromAddress");
        config.MailFromName = ObtenerOpcional("MailFromName", "KFitness");

        int smtpPort;
        if (!int.TryParse(ObtenerRequerido("SmtpPort"), out smtpPort) || smtpPort <= 0)
        {
            throw new InvalidOperationException("SmtpPort no es válido.");
        }
        config.SmtpPort = smtpPort;

        bool smtpSsl;
        if (!bool.TryParse(ObtenerRequerido("SmtpEnableSsl"), out smtpSsl))
        {
            throw new InvalidOperationException("SmtpEnableSsl no es válido.");
        }
        config.SmtpEnableSsl = smtpSsl;

        return config;
    }

    private static string ObtenerRequerido(string key)
    {
        string envValuePrioritario = Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(envValuePrioritario))
        {
            return envValuePrioritario.Trim();
        }

        string value = ConfigurationManager.AppSettings[key];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException("Falta configurar " + key + ".");
        }
        return value.Trim();
    }

    private static string ObtenerOpcional(string key, string fallback)
    {
        string envValuePrioritario = Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(envValuePrioritario))
        {
            return envValuePrioritario.Trim();
        }

        string value = ConfigurationManager.AppSettings[key];
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }
        return value.Trim();
    }

    private static string ConstruirHtml(string nombreDestino, string enlaceRecuperacion)
    {
        string nombreHtml = System.Web.HttpUtility.HtmlEncode(nombreDestino);
        string enlaceHtml = System.Web.HttpUtility.HtmlAttributeEncode(enlaceRecuperacion);

        return @"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Recuperación de contraseña - KFitness</title>
</head>
<body style='margin:0; padding:0; background-color:#f2f2f2; font-family:Arial,Helvetica,sans-serif;'>

    <table role='presentation' width='100%' cellspacing='0' cellpadding='0'
           style='background-color:#f2f2f2; padding:35px 12px;'>
        <tr>
            <td align='center'>

                <table role='presentation' width='100%' cellspacing='0' cellpadding='0'
                       style='max-width:580px; background-color:#ffffff; border-radius:12px; overflow:hidden;'>

                    <tr>
                        <td style='background-color:#070708; padding:30px 25px; text-align:center; border-bottom:5px solid #ED1C2E;'>
                            <h1 style='margin:0; color:#ffffff; font-size:28px; letter-spacing:1px;'>
                                K<span style='color:#ED1C2E;'>FITNESS</span>
                            </h1>
                            <p style='margin:8px 0 0; color:#bdbdbd; font-size:12px; letter-spacing:2px;'>
                                TU MEJOR VERSIÓN COMIENZA AQUÍ
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style='padding:38px 32px 25px; color:#333333;'>

                            <h2 style='margin:0 0 18px; color:#171717; font-size:23px;'>
                                Recuperación de contraseña
                            </h2>

                            <p style='font-size:15px; line-height:1.7; margin:0 0 15px;'>
                                ¡Hola <strong>" + nombreHtml + @"</strong>!
                            </p>

                            <p style='font-size:15px; line-height:1.7; margin:0 0 22px;'>
                                Recibimos una solicitud para restablecer la contraseña
                                de tu cuenta de KFitness. Para continuar, utiliza el
                                siguiente botón:
                            </p>

                            <table role='presentation' cellspacing='0' cellpadding='0'
                                   style='margin:0 auto 25px;'>
                                <tr>
                                    <td align='center' bgcolor='#ED1C2E'
                                        style='border-radius:7px;'>
                                        <a href='" + enlaceHtml + @"'
                                           style='display:inline-block; padding:15px 28px;
                                                  color:#ffffff; text-decoration:none;
                                                  font-size:15px; font-weight:bold;'>
                                            Restablecer mi contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style='font-size:13px; line-height:1.7; color:#666666; margin:0 0 15px;'>
                                Este enlace es válido durante <strong>30 minutos</strong>.
                                Si no solicitaste este cambio, puedes ignorar este correo.
                                Tu contraseña actual seguirá siendo la misma.
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td style='background-color:#070708; padding:22px 25px; text-align:center;'>
                            <p style='margin:0 0 7px; color:#ffffff; font-size:13px; font-weight:bold;'>
                                KFITNESS
                            </p>
                            <p style='margin:0; color:#aaaaaa; font-size:11px; line-height:1.6;'>
                                Este es un mensaje automático. Por favor, no respondas a este correo.
                            </p>
                            <p style='margin:10px 0 0; color:#777777; font-size:10px;'>
                                © " + DateTime.Now.Year + @" KFitness. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>";
    }

    private class SmtpConfig
    {
        public string SmtpHost;
        public int SmtpPort;
        public string SmtpUser;
        public string SmtpPassword;
        public bool SmtpEnableSsl;
        public string MailFromAddress;
        public string MailFromName;
    }
}