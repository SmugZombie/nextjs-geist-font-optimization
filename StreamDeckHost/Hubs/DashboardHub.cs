using Microsoft.AspNetCore.SignalR;

namespace StreamDeckHost.Hubs;

public class DashboardHub : Hub
{
    private readonly ILogger<DashboardHub> _logger;

    public DashboardHub(ILogger<DashboardHub> logger)
    {
        _logger = logger;
    }

    public async Task SendButtonPress(string buttonId, string pageId)
    {
        _logger.LogInformation($"Button pressed: {buttonId} on page: {pageId}");
        await Clients.All.SendAsync("ReceiveButtonPress", buttonId, pageId);
    }

    public async Task SendButtonFeedback(string buttonId, string status, string message)
    {
        _logger.LogInformation($"Button feedback: {buttonId} - {status} - {message}");
        await Clients.All.SendAsync("ReceiveButtonFeedback", buttonId, status, message);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }
}
