namespace MonopolyAPI.Data.MySqlEntities;

public class PartidaUsuarioEntity
{
    public int Id { get; set; }
    public int PartidaId { get; set; }
    public int UsuarioId { get; set; }
    public int DineroActual { get; set; } = 1500;
}
