using MonopolyAPI.Data;
using MonopolyAPI.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Configure Database (In-Memory for development)
builder.Services.AddDbContext<MonopolyDbContext>(options =>
    options.UseInMemoryDatabase("MonopolyDB"));

// Configure MySQL Database (Docker) for catalog/user data
var mySqlConnectionString = builder.Configuration.GetConnectionString("MySql")
    ?? builder.Configuration["MYSQL_CONNECTION_STRING"];

if (string.IsNullOrWhiteSpace(mySqlConnectionString))
{
    throw new InvalidOperationException(
        "Missing MySQL connection string. Set ConnectionStrings:MySql in appsettings.json or the MYSQL_CONNECTION_STRING environment variable.");
}

builder.Services.AddDbContext<MonopolyMySqlDbContext>(options =>
    options.UseMySql(mySqlConnectionString, ServerVersion.AutoDetect(mySqlConnectionString)));

// Register Services
builder.Services.AddScoped<IUserService, MySqlUserService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IBoardService, MySqlBoardService>();
builder.Services.AddScoped<ICardService, CardService>();
builder.Services.AddSingleton<IGameSessionService, GameSessionService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
