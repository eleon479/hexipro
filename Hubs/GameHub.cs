using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace Hexipro.Hubs
{
    public class GameHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            Console.WriteLine($"{user} > {message}");
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}