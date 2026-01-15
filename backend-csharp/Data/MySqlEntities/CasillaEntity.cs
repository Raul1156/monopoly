namespace MonopolyAPI.Data.MySqlEntities;

public class CasillaEntity
{
    public int Id { get; set; }
    public int Posicion { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public PropiedadEntity? Propiedad { get; set; }
}
