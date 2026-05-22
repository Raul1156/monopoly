using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data.MySqlEntities;

namespace MonopolyAPI.Data;

public class MonopolyMySqlDbContext : DbContext
{
    public MonopolyMySqlDbContext(DbContextOptions<MonopolyMySqlDbContext> options)
        : base(options)
    {
    }

    public DbSet<UsuarioEntity> Usuarios => Set<UsuarioEntity>();
    public DbSet<CasillaEntity> Casillas => Set<CasillaEntity>();
    public DbSet<PropiedadEntity> Propiedades => Set<PropiedadEntity>();
    public DbSet<PropiedadPartidaEntity> PropiedadesPartida => Set<PropiedadPartidaEntity>();
    public DbSet<PartidaUsuarioEntity> PartidasUsuarios => Set<PartidaUsuarioEntity>();
    public DbSet<PartidaEntity> Partidas => Set<PartidaEntity>();
    public DbSet<CartaEntity> Cartas => Set<CartaEntity>();
    public DbSet<ProductoEntity> Productos => Set<ProductoEntity>();
    public DbSet<InventarioEntity> Inventario => Set<InventarioEntity>();
    public DbSet<LogroEntity> Logros => Set<LogroEntity>();
    public DbSet<UsuarioLogroEntity> UsuarioLogros => Set<UsuarioLogroEntity>();
    public DbSet<RecompensaEntity> Recompensas => Set<RecompensaEntity>();
    public DbSet<HistorialRecompensaEntity> HistorialRecompensas => Set<HistorialRecompensaEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UsuarioEntity>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Avatar).HasColumnName("avatar").HasMaxLength(100);
            entity.Property(e => e.Color).HasColumnName("color").HasMaxLength(20);
            entity.Property(e => e.Elo).HasColumnName("elo");
            entity.Property(e => e.MonedaLobby).HasColumnName("moneda_lobby");
            entity.Property(e => e.Gemas).HasColumnName("gemas");
            entity.Property(e => e.Nivel).HasColumnName("nivel");
            entity.Property(e => e.Experiencia).HasColumnName("experiencia");
            entity.Property(e => e.PartidasJugadas).HasColumnName("partidas_jugadas");
            entity.Property(e => e.PartidasGanadas).HasColumnName("partidas_ganadas");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.TiempoJugadoMinutos).HasColumnName("tiempo_jugado_minutos");
            entity.Property(e => e.RachaActual).HasColumnName("racha_actual");
            entity.Property(e => e.MejorRacha).HasColumnName("mejor_racha");
            entity.Property(e => e.EsAdmin).HasColumnName("es_admin");
            entity.Property(e => e.TwoFactorSecret).HasColumnName("two_factor_secret").HasMaxLength(255);
            entity.Property(e => e.TwoFactorEnabled).HasColumnName("two_factor_enabled");
            entity.Property(e => e.UltimoLogin).HasColumnName("ultimo_login");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<CasillaEntity>(entity =>
        {
            entity.ToTable("casillas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Posicion).HasColumnName("posicion").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.HasIndex(e => e.Posicion).IsUnique();
        });

        modelBuilder.Entity<PropiedadEntity>(entity =>
        {
            entity.ToTable("propiedades");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.CasillaId).HasColumnName("casilla_id").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Precio).HasColumnName("precio").IsRequired();
            entity.Property(e => e.AlquilerBase).HasColumnName("alquiler_base").IsRequired();
            entity.Property(e => e.AlquilerNivel1).HasColumnName("alquiler_nivel_1");
            entity.Property(e => e.AlquilerNivel2).HasColumnName("alquiler_nivel_2");
            entity.Property(e => e.AlquilerNivel3).HasColumnName("alquiler_nivel_3");
            entity.Property(e => e.AlquilerNivel4).HasColumnName("alquiler_nivel_4");
            entity.Property(e => e.AlquilerHotel).HasColumnName("alquiler_hotel");
            entity.Property(e => e.PrecioMejora).HasColumnName("precio_mejora");
            entity.Property(e => e.ColorGrupo).HasColumnName("color_grupo").HasMaxLength(50);

            entity.HasOne(e => e.Casilla)
                .WithOne(c => c.Propiedad)
                .HasForeignKey<PropiedadEntity>(e => e.CasillaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PropiedadPartidaEntity>(entity =>
        {
            entity.ToTable("propiedades_partida");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.PartidaId).HasColumnName("partida_id").IsRequired();
            entity.Property(e => e.PropiedadId).HasColumnName("propiedad_id").IsRequired();
            entity.Property(e => e.Nivel).HasColumnName("nivel").IsRequired();
            entity.Property(e => e.PropietarioId).HasColumnName("propietario_id").IsRequired();
            entity.HasIndex(e => new { e.PartidaId, e.PropiedadId });
        });

        modelBuilder.Entity<PartidaEntity>(entity =>
        {
            entity.ToTable("partidas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.CodigoPartida).HasColumnName("codigo_partida").HasMaxLength(20);
            entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(20);
            entity.Property(e => e.TurnoActual).HasColumnName("turno_actual");
            entity.Property(e => e.JugadorTurnoId).HasColumnName("jugador_turno_id");
            entity.Property(e => e.RondaActual).HasColumnName("ronda_actual");
            entity.Property(e => e.MaxJugadores).HasColumnName("max_jugadores");
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio");
            entity.Property(e => e.FechaFin).HasColumnName("fecha_fin");
            entity.Property(e => e.GanadorId).HasColumnName("ganador_id");

            entity.HasIndex(e => e.CodigoPartida).IsUnique();
            entity.HasIndex(e => e.Estado);

            entity.HasMany(e => e.Jugadores)
                .WithOne(j => j.Partida)
                .HasForeignKey(j => j.PartidaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PartidaUsuarioEntity>(entity =>
        {
            entity.ToTable("partida_usuarios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.PartidaId).HasColumnName("partida_id").IsRequired();
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.OrdenJuego).HasColumnName("orden_juego");
            entity.Property(e => e.PosicionActual).HasColumnName("posicion_actual");
            entity.Property(e => e.DineroActual).HasColumnName("dinero_actual").IsRequired();
            entity.Property(e => e.TurnosCarcel).HasColumnName("turnos_carcel");
            entity.Property(e => e.PosicionFinal).HasColumnName("posicion_final");
            entity.Property(e => e.EloGanado).HasColumnName("elo_ganado");
            entity.Property(e => e.MonedaGanada).HasColumnName("moneda_ganada");
            entity.Property(e => e.ExperienciaGanada).HasColumnName("experiencia_ganada");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.HasIndex(e => new { e.PartidaId, e.UsuarioId }).IsUnique();

            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartaEntity>(entity =>
        {
            entity.ToTable("cartas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").IsRequired();
            entity.Property(e => e.Efecto).HasColumnName("efecto").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Valor).HasColumnName("valor").IsRequired();

            entity.HasIndex(e => e.Tipo);
        });

        modelBuilder.Entity<ProductoEntity>(entity =>
        {
            entity.ToTable("productos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Precio).HasColumnName("precio").IsRequired();
            entity.Property(e => e.Moneda).HasColumnName("moneda").HasMaxLength(20);
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(20);
            entity.Property(e => e.Rareza).HasColumnName("rareza").HasMaxLength(20);
            entity.Property(e => e.Preview).HasColumnName("preview").HasMaxLength(255);
            entity.Property(e => e.Disponible).HasColumnName("disponible");
        });

        modelBuilder.Entity<InventarioEntity>(entity =>
        {
            entity.ToTable("inventario");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.ProductoId).HasColumnName("producto_id").IsRequired();
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.Equipado).HasColumnName("equipado");
            entity.Property(e => e.FechaCompra).HasColumnName("fecha_compra");

            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.ProductoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LogroEntity>(entity =>
        {
            entity.ToTable("logros");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Icono).HasColumnName("icono").HasMaxLength(10);
            entity.Property(e => e.RecompensaPts).HasColumnName("recompensa_pts");
            entity.Property(e => e.Condicion).HasColumnName("condicion").HasMaxLength(100).IsRequired();
            entity.Property(e => e.ValorObjetivo).HasColumnName("valor_objetivo");
        });

        modelBuilder.Entity<UsuarioLogroEntity>(entity =>
        {
            entity.ToTable("usuario_logros");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.LogroId).HasColumnName("logro_id").IsRequired();
            entity.Property(e => e.DesbloqueadoEn).HasColumnName("desbloqueado_en");
            entity.HasIndex(e => new { e.UsuarioId, e.LogroId }).IsUnique();

            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Logro)
                .WithMany()
                .HasForeignKey(e => e.LogroId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RecompensaEntity>(entity =>
        {
            entity.ToTable("recompensas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(20).IsRequired();
            entity.Property(e => e.MonedaLobby).HasColumnName("moneda_lobby");
            entity.Property(e => e.Gemas).HasColumnName("gemas");
            entity.Property(e => e.Experiencia).HasColumnName("experiencia");
            entity.Property(e => e.Requisito).HasColumnName("requisito").HasMaxLength(255);
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
        });

        modelBuilder.Entity<HistorialRecompensaEntity>(entity =>
        {
            entity.ToTable("historial_recompensas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.RecompensaId).HasColumnName("recompensa_id").IsRequired();
            entity.Property(e => e.MonedaRecibida).HasColumnName("moneda_recibida");
            entity.Property(e => e.GemasRecibidas).HasColumnName("gemas_recibidas");
            entity.Property(e => e.ExperienciaRecibida).HasColumnName("experiencia_recibida");
            entity.Property(e => e.Fecha).HasColumnName("fecha");

            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Recompensa)
                .WithMany()
                .HasForeignKey(e => e.RecompensaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
