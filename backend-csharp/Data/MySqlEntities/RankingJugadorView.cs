namespace MonopolyAPI.Data.MySqlEntities;

public class RankingJugadorView
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Elo { get; set; }
    public int Nivel { get; set; }
    public int PartidasJugadas { get; set; }
    public int PartidasGanadas { get; set; }
    public decimal? PorcentajeVictorias { get; set; }
}
