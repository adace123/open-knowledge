{
  description = "OpenKnowledge — CLI/server packaged from the published npm release";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [
        "aarch64-linux"
        "x86_64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (system:
        let
          package = nixpkgs.legacyPackages.${system}.callPackage ./nix/package.nix { };
        in
        {
          default = package;
          open-knowledge = package;
        });
    };
}
