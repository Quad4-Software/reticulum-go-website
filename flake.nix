{
  description = "Quad4 Reticulum Go Website development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        go = pkgs.go_1_25;

        task = pkgs.buildGoModule rec {
          pname = "task";
          version = "3.46.3";

          src = pkgs.fetchFromGitHub {
            owner = "go-task";
            repo = "task";
            rev = "v${version}";
            hash = "sha256-1bS8ZZAcemgRG7PTeGTFfd49T9u6U6CxxrbotwCM15A=";
          };

          vendorHash = "sha256-Tm0tqureCRwcP5KKDTa9TO1yZ3Px3ulf9/jKQDDTjDw=";
          subPackages = [ "cmd/task" ];

          doCheck = false;

          meta = with pkgs.lib; {
            description = "A task runner / simpler Make alternative written in Go";
            homepage = "https://taskfile.dev/";
            license = licenses.mit;
            maintainers = with maintainers; [ ];
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            go
            task
            nodejs_20
            nodePackages.pnpm
            gcc
            pkg-config
          ];

          shellHook = ''
            echo "Quad4 Reticulum Go Website Development Environment"
            echo "Go version: $(go version)"
            echo "Task version: $(task --version 2>/dev/null || echo 'installed')"
            echo "Node version: $(node --version)"
            echo "pnpm version: $(pnpm --version)"
          '';
        };
      });
}

