namespace MonopolyAPI.Data.MySqlEntities;

public class PropiedadPartidaEntity
{
    public int Id { get; set; }
    public int PartidaId { get; set; }
    public int PropiedadId { get; set; }
    public int Nivel { get; set; } = 0;
    public int PropietarioId { get; set; }
}
