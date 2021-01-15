using System;
using System.Net.WebSockets;
using System.Threading.Tasks;
using Hexipro.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Hexipro
{
    public class Startup
    {
        // This method gets called by the runtime.
        // Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSignalR(hubOptions =>
            {
                hubOptions.EnableDetailedErrors = true;
                hubOptions.KeepAliveInterval = TimeSpan.FromSeconds(20);
            });
            services.AddControllersWithViews();
            services.AddDirectoryBrowser();
            services.AddCors();
        }

        // This method gets called by the runtime.
        // Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // @TODO add some production-level exception handling before first deployment
                app.UseDeveloperExceptionPage();
                // app.UseExceptionHandler("/Error");
                // app.UseHsts();
            }
            
            app.UseCors();
            
            var forwardedHeadersOptions = new ForwardedHeadersOptions {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            };
            forwardedHeadersOptions.KnownNetworks.Clear();
            forwardedHeadersOptions.KnownProxies.Clear();
            app.UseForwardedHeaders(forwardedHeadersOptions);

            var rewriteOptions = new RewriteOptions().AddRedirectToHttps(308);
            app.UseRewriter(rewriteOptions);

            // app.UseHttpsRedirection();

            app.UseDefaultFiles();
            app.UseStaticFiles();
            
            app.UseRouting();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                // @TODO fix some routing issues in development release
                // endpoints.MapGet("/", context =>
                // {
                //     //await context.Response.WriteAsync("Hello World!");
                //     context.Response.Redirect("index.html", true);
                //     return Task.CompletedTask;
                // }).WithDisplayName("Root to index.html redirect");
                //
                // endpoints.MapDefaultControllerRoute();
                //
                // GameHub mapping
                endpoints.MapHub<GameHub>("/game");
            });

        }

    }
}