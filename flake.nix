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
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            go-task
            nodejs_22
            nodePackages.pnpm
          ];

          shellHook = ''
            echo "Quad4 Reticulum Go Website Development Environment"
            echo "Task version: $(task --version 2>/dev/null || echo 'installed')"
            echo "Node version: $(node --version)"
            echo "pnpm version: $(pnpm --version)"
          '';
        };
      });
}

