namespace MonopolyAPI.Data.MySqlEntities;

public class PartidaEntity
{
    public int Id { get; set; }
    public string? CodigoPartida { get; set; }
    public string Estado { get; set; } = "esperando";
    public int TurnoActual { get; set; } = 1;
    public int? JugadorTurnoId { get; set; }
    public int RondaActual { get; set; } = 1;
    public int MaxJugadores { get; set; } = 4;
    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaFin { get; set; }
    public int? GanadorId { get; set; }

    // Navigation
    public List<PartidaUsuarioEntity> Jugadores { get; set; } = new();
}
