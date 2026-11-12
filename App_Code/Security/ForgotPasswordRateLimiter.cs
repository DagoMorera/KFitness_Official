using System;
using System.Collections.Concurrent;

public static class ForgotPasswordRateLimiter
{
    private static readonly ConcurrentDictionary<string, ContadorVentana> _estado = new ConcurrentDictionary<string, ContadorVentana>(StringComparer.OrdinalIgnoreCase);
    private static readonly object _limpiezaLock = new object();
    private static DateTime _ultimaLimpiezaUtc = DateTime.UtcNow;

    private const int MaxSolicitudesIp = 10;
    private const int VentanaMinutosIp = 15;
    private const int CapacidadMaxima = 5000;

    public static bool ExcedioLimitePorIp(string ip)
    {
        LimpiarSiHaceFalta();

        string key = string.IsNullOrWhiteSpace(ip) ? "unknown" : ip.Trim();
        DateTime ahora = DateTime.UtcNow;

        ContadorVentana nuevo = _estado.AddOrUpdate(
            key,
            delegate(string k)
            {
                ContadorVentana c = new ContadorVentana();
                c.InicioUtc = ahora;
                c.Cantidad = 1;
                c.UltimoUtc = ahora;
                return c;
            },
            delegate(string k, ContadorVentana actual)
            {
                lock (actual.Sync)
                {
                    if (actual.InicioUtc.AddMinutes(VentanaMinutosIp) <= ahora)
                    {
                        actual.InicioUtc = ahora;
                        actual.Cantidad = 1;
                    }
                    else
                    {
                        actual.Cantidad = actual.Cantidad + 1;
                    }
                    actual.UltimoUtc = ahora;
                    return actual;
                }
            });

        if (_estado.Count > CapacidadMaxima)
        {
            LimpiarEstadoAntiguo(ahora);
        }

        return nuevo.Cantidad > MaxSolicitudesIp;
    }

    private static void LimpiarSiHaceFalta()
    {
        DateTime ahora = DateTime.UtcNow;
        if (_ultimaLimpiezaUtc.AddMinutes(5) > ahora)
        {
            return;
        }

        lock (_limpiezaLock)
        {
            if (_ultimaLimpiezaUtc.AddMinutes(5) > ahora)
            {
                return;
            }

            LimpiarEstadoAntiguo(ahora);
            _ultimaLimpiezaUtc = ahora;
        }
    }

    private static void LimpiarEstadoAntiguo(DateTime ahora)
    {
        foreach (var par in _estado)
        {
            ContadorVentana item = par.Value;
            if (item == null) continue;

            DateTime ultimo;
            lock (item.Sync)
            {
                ultimo = item.UltimoUtc;
            }

            if (ultimo.AddMinutes(VentanaMinutosIp * 2) < ahora)
            {
                ContadorVentana removido;
                _estado.TryRemove(par.Key, out removido);
            }
        }
    }

    private class ContadorVentana
    {
        public readonly object Sync = new object();
        public DateTime InicioUtc;
        public DateTime UltimoUtc;
        public int Cantidad;
    }
}