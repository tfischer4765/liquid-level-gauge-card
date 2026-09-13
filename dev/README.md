# Local test setup

An isolated Home Assistant instance for developing `liquid-level-gauge-card`, deliberately
kept away from any productive HA on the same network.

## Prerequisites

- Docker Desktop running
- Node.js and `npm install` done in the repository root

## Running it

Two processes, in two terminals:

```bash
# 1. Repository root -- builds the card and serves it on :5001, rebuilds on save
npm start

# 2. This directory -- the test Home Assistant instance
cd dev
docker compose up -d
```

Then open <http://127.0.0.1:8124>, complete the one-time onboarding (any local
account, no cloud) and open the **Liquid Level Gauge** dashboard.

The dashboard has two sliders at the top. Drag `Tank Level` and the fill in every
card below follows. After changing card source, `npm start` rebuilds automatically
— a browser refresh (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>) picks it up.

## Teardown

```bash
docker compose down          # stop, keep the HA state (skips onboarding next time)
docker compose down -v       # stop and discard everything
```

## Parameter matrix (headless)

`test-params.html` renders the built card once per documented option against a
stubbed `hass`, so every parameter can be checked without Home Assistant at all.
It needs to be served from the same origin as the bundle:

```bash
cp dev/test-params.html dist/          # dist/ is the dev server's document root
open http://127.0.0.1:5001/test-params.html
```

Headless, with a screenshot and the machine-readable results:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --screenshot=/tmp/params.png \
  --window-size=1280,1500 --virtual-time-budget=8000 \
  http://127.0.0.1:5001/test-params.html
```

The page also exposes `window.__RESULTS__` and a hidden `<pre id="results">` with
the rendered text, fill transform and colour per case — that is what makes the
level maths checkable rather than merely eyeballable.

## Why it is built this way

The point of these choices is that a productive HA instance on the same LAN is
never involved and never affected.

**No `default_config:`.** That one line is a meta-integration pulling in `ssdp`,
`zeroconf`, `dhcp`, `usb`, `bluetooth` and `cloud`. It would make this throwaway
instance browse the LAN and discover real devices. Discovery alone is read-only,
but configuring a discovered device means two HA instances driving the same
hardware — and some integrations only tolerate one session, so the test rig could
knock the productive instance off its own devices. Everything needed is named
explicitly in `ha-config/configuration.yaml` instead.

**Bridge networking, not `network_mode: host`.** Host mode is what the HA docs
recommend *for* discovery, which is precisely what must not happen here. Home
Assistant still opens an mDNS socket on UDP 5353 because `zeroconf` gets pulled in
as a dependency, but on the Docker bridge that traffic does not reach the physical
network — verified with `dns-sd -B _home-assistant._tcp local.`, which lists the
productive instance and not this container.

**Loopback-only port binding** (`127.0.0.1:8124:8123`). Nothing else on the network
can reach the test instance, and port 8124 keeps it from ever being confused with a
productive instance on the default 8123.

**Fake entities.** `input_number` helpers give sliders to drive the card with. No
real sensor, no integration, no network traffic — and dragging a value is a far
better test than waiting for a real one to change.

**No credentials.** Do not sign this instance into Nabu Casa, Google or Alexa; that
is the one remaining way it could collide with a productive setup.

## Gotchas discovered while building this

**Port 5000 is taken on macOS.** The AirPlay Receiver (`ControlCenter`) binds it by
default since Monterey, so the dev server uses 5001. Either disable *Settings →
General → AirDrop & Handoff → AirPlay Receiver* or leave the port as is.

**No explicit `http:` block.** Home Assistant treats a changed HTTP config as
"pending" and rolls it back with a restart if no client confirms it within five
minutes. The container just flaps. The defaults are what the port mapping expects
anyway.

**The resource URL is fetched by the browser, not by Home Assistant.** That is why
`http://127.0.0.1:5001/liquid-level-gauge-card.js` works from inside a container — 127.0.0.1
resolves on the Mac, where the dev server runs. The cross-port load succeeds because
the rollup dev server sends `Access-Control-Allow-Origin: *`.

## Smoke test against a real instance

Once the card works here, a final check on real hardware is reasonable — but build
it first and copy `dist/liquid-level-gauge-card.js` to that instance's `config/www/`,
referencing it as `/local/liquid-level-gauge-card.js`. Do not point a productive instance at
this dev server: Lovelace resources are global, so every dashboard in the household
would execute the development build and break whenever the Mac sleeps.
