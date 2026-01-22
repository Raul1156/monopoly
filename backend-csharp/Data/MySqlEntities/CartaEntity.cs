namespace MonopolyAPI.Data.MySqlEntities;

public class CartaEntity
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Efecto { get; set; } = string.Empty;
    public int Valor { get; set; }
}
