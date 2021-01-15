# Dockerfile

# https://hub.docker.com/_/microsoft-dotnet
FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build-env
WORKDIR /app

# copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# copy everything else and build
COPY . .
RUN dotnet publish -c Release -o out

# build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:5.0
WORKDIR /app
COPY --from=build-env /app/out .

# run the app on container startup

# ENTRYPOINT ["dotnet", "Hexipro.dll"]
# Use the following instead for Heroku
CMD ASPNETCORE_URLS=http://*:$PORT dotnet Hexipro.dll