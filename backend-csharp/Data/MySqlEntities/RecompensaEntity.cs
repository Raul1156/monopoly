namespace MonopolyAPI.Data.MySqlEntities;

public class RecompensaEntity
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Tipo { get; set; } = "diaria";
    public int MonedaLobby { get; set; }
    public int Gemas { get; set; }
    public int Experiencia { get; set; }
    public string? Requisito { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime CreadoEn { get; set; }
}

public class HistorialRecompensaEntity
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int RecompensaId { get; set; }
    public int MonedaRecibida { get; set; }
    public int GemasRecibidas { get; set; }
    public int ExperienciaRecibida { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Navigation
    public UsuarioEntity? Usuario { get; set; }
    public RecompensaEntity? Recompensa { get; set; }
}
