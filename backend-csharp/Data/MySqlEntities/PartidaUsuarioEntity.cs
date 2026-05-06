namespace MonopolyAPI.Data.MySqlEntities;

public class PartidaUsuarioEntity
{
    public int Id { get; set; }
    public int PartidaId { get; set; }
    public int UsuarioId { get; set; }
    public int OrdenJuego { get; set; }
    public int PosicionActual { get; set; } = 0;
    public int DineroActual { get; set; } = 1500;
    public int TurnosCarcel { get; set; } = 0;
    public bool Activo { get; set; } = true;

    // Navigation
    public PartidaEntity? Partida { get; set; }
    public UsuarioEntity? Usuario { get; set; }
}
