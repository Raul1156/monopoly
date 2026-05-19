namespace MonopolyAPI.Data.MySqlEntities;

public class LogroEntity
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public int RecompensaPts { get; set; }
    public string Condicion { get; set; } = string.Empty;
    public int ValorObjetivo { get; set; } = 1;
}

public class UsuarioLogroEntity
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int LogroId { get; set; }
    public DateTime DesbloqueadoEn { get; set; } = DateTime.UtcNow;

    // Navigation
    public UsuarioEntity? Usuario { get; set; }
    public LogroEntity? Logro { get; set; }
}
