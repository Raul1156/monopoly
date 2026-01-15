namespace MonopolyAPI.Data.MySqlEntities;

public class PropiedadEntity
{
    public int Id { get; set; }
    public int CasillaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Precio { get; set; }
    public int AlquilerBase { get; set; }
    public int? AlquilerNivel1 { get; set; }
    public int? AlquilerNivel2 { get; set; }
    public int? AlquilerNivel3 { get; set; }
    public int? PrecioMejora { get; set; }
    public string? ColorGrupo { get; set; }

    public CasillaEntity? Casilla { get; set; }
}
