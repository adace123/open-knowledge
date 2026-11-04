{
  lib,
  stdenvNoCC,
  fetchurl,
  makeWrapper,
  nodejs_24,
  git,
  openssh,
  cacert,
  perl,
  gnugrep,
}:
let
  pins = builtins.fromJSON (builtins.readFile ./pins.json);
in
stdenvNoCC.mkDerivation {
  pname = "open-knowledge";
  inherit (pins) version;

  src = fetchurl {
    url = pins.tarball;
    hash = pins.hash;
  };

  nativeBuildInputs = [
    makeWrapper
    perl
    gnugrep
  ];
  dontConfigure = true;
  dontBuild = true;
  # dist/native ships .node binaries for every platform; do not strip foreign
  # architectures.
  dontStrip = true;

  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/open-knowledge $out/bin
    cp -r ./. $out/lib/open-knowledge/
    dist=$out/lib/open-knowledge/dist

    # The CLI's internal git calls pass `.env({GIT_DIR: …})`, which replaces the
    # entire child environment. Without PATH the spawn fails (ENOENT) on NixOS,
    # and without HOME git cannot read its config, so edit history is silently
    # disabled. Add both to every GIT_DIR env object.
    perl -pi -e 's/(?<!process\.env,)\{GIT_DIR:/{PATH:process.env.PATH,HOME:process.env.HOME,GIT_DIR:/g' $dist/*.mjs
    if grep -qP '(?<!process\.env,)\{GIT_DIR:' $dist/*.mjs; then
      echo "git env patch did not apply" >&2
      exit 1
    fi
    grep -q 'PATH:process.env.PATH,HOME:process.env.HOME,GIT_DIR' $dist/*.mjs

    makeWrapper ${nodejs_24}/bin/node $out/bin/ok \
      --add-flags $dist/cli.mjs \
      --prefix PATH : ${lib.makeBinPath [ nodejs_24 git openssh ]} \
      --set-default SSL_CERT_FILE "${cacert}/etc/ssl/certs/ca-bundle.crt" \
      --set-default SSL_CERT_DIR "${cacert}/etc/ssl/certs" \
      --set-default NODE_EXTRA_CA_CERTS "${cacert}/etc/ssl/certs/ca-bundle.crt"
    ln -s ok $out/bin/open-knowledge
    runHook postInstall
  '';

  meta = {
    description = "Local-first Markdown knowledge base with a web editor and MCP endpoint";
    homepage = "https://openknowledge.ai";
    license = lib.licenses.gpl3Plus;
    mainProgram = "ok";
    platforms = lib.platforms.unix;
  };
}
