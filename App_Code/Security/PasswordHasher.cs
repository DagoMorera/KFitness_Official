using System;
using System.Security.Cryptography;
using System.Text;

public static class PasswordHasher
{
    // Formato almacenado: PBKDF2$<iteraciones>$<saltBase64>$<hashBase64>
    private const int SaltSize = 16; // bytes
    private const int HashSize = 32; // bytes
    private const int Iterations = 10000;

    public static string HashPassword(string password)
    {
        if (password == null) throw new ArgumentNullException("password");

        using (var rng = new RNGCryptoServiceProvider())
        {
            var salt = new byte[SaltSize];
            rng.GetBytes(salt);

            using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations))
            {
                var hash = pbkdf2.GetBytes(HashSize);
                return "PBKDF2$" + Iterations + "$" + Convert.ToBase64String(salt) + "$" + Convert.ToBase64String(hash);
            }
        }
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        if (password == null) throw new ArgumentNullException("password");
        if (string.IsNullOrEmpty(storedHash)) return false;

        try
        {
            var parts = storedHash.Split('$');
            if (parts.Length != 4) return false;
            // parts[0] = algorithm
            var iterations = int.Parse(parts[1]);
            var salt = Convert.FromBase64String(parts[2]);
            var hash = Convert.FromBase64String(parts[3]);

            using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations))
            {
                var testHash = pbkdf2.GetBytes(hash.Length);
                return AreEqualSlow(hash, testHash);
            }
        }
        catch
        {
            return false;
        }
    }

    private static bool AreEqualSlow(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        var diff = 0;
        for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }

    // Compatibilidad: método público sencillo llamado Verify para que handlers lo invoquen
    public static bool Verify(string password, string storedHash)
    {
        try
        {
            return VerifyPassword(password, storedHash);
        }
        catch
        {
            return false;
        }
    }
}
