using System;

public class Usuario
{
    public int IdUsuario { get; set; }
    public string Correo { get; set; }
    public string ClaveHash { get; set; }
    public int IdRol { get; set; }
    public string Nombre { get; set; }
    public string Apellido1 { get; set; }
    public string Apellido2 { get; set; }
    public string Telefono { get; set; }
    public string FotoPerfil { get; set; }
    public bool Activo { get; set; }
    public int IntentosFallidos { get; set; }
    public DateTime? BloqueadoHasta { get; set; }
    public DateTime? UltimoAcceso { get; set; }
    // Nota: FechaNacimiento no existe en seg.Usuarios; se omite intencionalmente.
}
