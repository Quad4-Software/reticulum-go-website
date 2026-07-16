/**
 * Shared Python / Go snippets derived from the official RNS Minimal example
 * and the Reticulum-Go API reference quick-start recipe.
 */

export const PY_MINIMAL = `import RNS

APP_NAME = "example_utilities"

reticulum = RNS.Reticulum(configpath)
identity = RNS.Identity()

destination = RNS.Destination(
    identity,
    RNS.Destination.IN,
    RNS.Destination.SINGLE,
    APP_NAME,
    "minimalsample",
)

destination.set_proof_strategy(RNS.Destination.PROVE_ALL)
destination.announce()
print(RNS.prettyhexrep(destination.hash))
`;

export const GO_MINIMAL = `package main

import (
\t"log"

\t"quad4/reticulum-go/pkg/destination"
\t"quad4/reticulum-go/pkg/identity"
\t"quad4/reticulum-go/pkg/node"
\t"quad4/reticulum-go/pkg/reticulumconfig"
)

const appName = "example_utilities"

func main() {
\tcfg, err := reticulumconfig.InitConfig()
\tif err != nil {
\t\tlog.Fatal(err)
\t}
\tn, err := node.New(cfg)
\tif err != nil {
\t\tlog.Fatal(err)
\t}
\tif err := n.Start(); err != nil {
\t\tlog.Fatal(err)
\t}
\tdefer n.Stop()

\tid, err := identity.New()
\tif err != nil {
\t\tlog.Fatal(err)
\t}
\tdest, err := destination.New(
\t\tid,
\t\tdestination.In|destination.Out,
\t\tdestination.Single,
\t\tappName,
\t\tn.Transport(),
\t\t"minimal",
\t)
\tif err != nil {
\t\tlog.Fatal(err)
\t}
\tif err := dest.Announce(false, nil, nil); err != nil {
\t\tlog.Fatal(err)
\t}
\tlog.Printf("listening on %x", dest.GetHash())
}
`;

export const PY_ANNOUNCE = `import RNS

# After creating a SINGLE destination as in the Minimal example:
destination.announce()
# Optional application bytes travel with the signed announce.
destination.announce(app_data=b"hello-mesh")
`;

export const GO_ANNOUNCE = `// Fragment from quad4/reticulum-go/pkg/destination usage
if err := dest.Announce(false, nil, nil); err != nil {
\tlog.Fatal(err)
}
appData := []byte("hello-mesh")
if err := dest.Announce(false, appData, nil); err != nil {
\tlog.Fatal(err)
}
`;

export const PY_PLAIN = `import RNS

# PLAIN destinations are for local public broadcast.
# They are not transported over multiple hops.
plain = RNS.Destination(
    None,
    RNS.Destination.IN,
    RNS.Destination.PLAIN,
    "example_utilities",
    "localbroadcast",
)
`;

export const GO_PLAIN = `// Fragment from quad4/reticulum-go/pkg/destination
// Plain destinations omit an identity and use destination.Plain.
// They stay local. The stack does not multi-hop plain packets.
dest, err := destination.New(
\tnil,
\tdestination.In|destination.Out,
\tdestination.Plain,
\t"example_utilities",
\tn.Transport(),
\t"localbroadcast",
)
`;

export const PY_PATH = `import RNS

# Ask the network for a path when you only have a destination hash.
if not RNS.Transport.has_path(destination_hash):
    RNS.Transport.request_path(destination_hash)
`;

export const GO_PATH = `// Fragment from quad4/reticulum-go transport helpers
if !n.Transport().HasPath(peerDestHash) {
\t_ = n.Transport().RequestPath(peerDestHash, "", nil, false)
}
`;

export const PY_IDENTITY = `import RNS

identity = RNS.Identity()
# Persist so restarts keep the same cryptographic self.
identity.to_file("identity")
loaded = RNS.Identity.from_file("identity")
print(RNS.prettyhexrep(loaded.hash))
`;

export const GO_IDENTITY = `package main

import (
\t"log"

\t"quad4/reticulum-go/pkg/identity"
)

func main() {
\tid, err := identity.New()
\tif err != nil {
\t\tlog.Fatal(err)
\t}
\tif err := id.ToFile("identity"); err != nil {
\t\tlog.Fatal(err)
\t}
\tloaded, err := identity.FromFile("identity")
\tif err != nil {
\t\tlog.Fatal(err)
\t}
\tlog.Printf("identity hash %x", loaded.Hash)
}
`;

export const PY_LINK = `import RNS

# After you know the peer destination hash and have a path:
server_identity = RNS.Identity.recall(destination_hash)
link = RNS.Link(
    RNS.Destination(
        server_identity,
        RNS.Destination.OUT,
        RNS.Destination.SINGLE,
        "example_utilities",
        "linkexample",
    )
)
# When the link is ready, send requests or data over it.
`;

export const GO_LINK = `// Fragment from quad4/reticulum-go/pkg/link usage
remoteID, err := identity.Recall(peerDestHash)
if err != nil {
\tlog.Fatal(err)
}
out, err := destination.FromHash(peerDestHash, remoteID, destination.Single, n.Transport())
if err != nil {
\tlog.Fatal(err)
}
l := link.NewLink(out, n.Transport(), nil, nil, nil)
if err := l.Establish(); err != nil {
\tlog.Fatal(err)
}
`;
