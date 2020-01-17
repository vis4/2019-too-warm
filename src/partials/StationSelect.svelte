<script>
    import { csv } from 'd3-fetch';
    import { group } from 'd3-array';
    import { maxDate, msg, language } from '../stores';
    import { tick } from 'svelte';
    import { timeFormat } from 'd3-time-format';

    const parseStations = d => ({
        ...d,
        from: new Date(d.from),
        to: new Date(d.to),
        altitude: +d.altitude
    });

    const tfmt = timeFormat('%Y/%m/%d');

    let userSelectedStation = false;

    export let station;

    export let stations = [];
    $: groupedStations = Array.from(group(stations, d => d.state))
        .map(([k, v]) => v)
        .sort((a, b) => (a[0].state > b[0].state ? 1 : a[0].state < b[0].state ? -1 : 0));

    const loadStations = csv(
        '/blog/interactives/2019-too-warm/data/stations.csv',
        parseStations
    ).then(async res => {
        stations = res
            .filter(d => d.from.getFullYear() <= 1980 && d.to.getFullYear() >= 2019)
            .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));

        await tick();
        hashChange();
        if (!station) {
            // try to get location from user
            findNearestStation();

            // pick random station
            const initStations = [
                '00433'
                // '01975',
                // '03668',
                // '00691',
                // '05792',
                // '01420',
                // '03987',
                // '03126',
                // '01270',
                // '00880',
                // '02667'
            ];
            const random = initStations[Math.floor(Math.random() * 0.99 * initStations.length)];
            station = stations.find(s => s.id === random);
        } else {
            userSelectedStation = true;
        }
    });

    $: {
        if (station && station.name) {
            const hashParts = [$language];
            if (userSelectedStation) {
                hashParts.push(station.id);
                hashParts.push(
                    station.name
                        .toLowerCase()
                        .split('(')[0]
                        .trim()
                        .replace(/ö/g, 'oe')
                        .replace(/ä/g, 'ae')
                        .replace(/ü/g, 'ue')
                        .replace(/[^a-z-]/g, '')
                );
            }
            if (tfmt($maxDate) < tfmt(new Date())) {
                hashParts.push(tfmt($maxDate));
            }
            window.location.hash = `#/${hashParts.join('/')}`;
        }
    }

    function hashChange() {
        const match = window.location.hash.match(
            /^#\/(de|en)(?:\/(\d{5})\/[^\/]+)?(?:\/(\d{4}\/\d{2}\/\d{2}))?/
        );
        if (match && stations.length) {
            const [lang, sid, date] = match.slice(1);
            if (lang) $language = lang;

            if (!station || (sid && sid !== station.id)) {
                station = stations.find(d => d.id === sid);
            }

            if (date) {
                // restore maxDate
                $maxDate = new Date(date);
            }
        }
    }

    function latLonDist(lat1, lon1, lat2, lon2) {
        const p = 0.017453292519943295; // This is  Math.PI / 180
        const c = Math.cos;
        const a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
        const R = 6371; //  Earth distance in km so it will return the distance in km
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    function findNearestStation(event) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                // compute distances
                stations.forEach(s => {
                    s.dist = latLonDist(latitude, longitude, s.lat, s.lon);
                });
                userSelectedStation = !!event;
                station = stations.sort((a, b) => a.dist - b.dist)[0];
            },
            () => {}
        );
    }
</script>

<style>
    a i.im {
        font-size: 16px;
        position: relative;
        top: 2px;
    }
    label {
        display: block;
    }
</style>

<svelte:window on:hashchange={() => hashChange(false)} />

{#await loadStations then res}
    <label class="form-text">{$msg.selectStation.replace('%count%', stations.length)}</label>

    <select
        class="custom-select"
        bind:value={station}
        on:change={() => (userSelectedStation = true)}>
        <option value={null}>(select station)</option>
        {#each groupedStations as stations}
            <optgroup label={stations[0].state}>
                {#each stations as s}
                    <option value={s}>{s.name}</option>
                {/each}
            </optgroup>
        {/each}
    </select>
    oder
    <a href="#/near-me" on:click|preventDefault={findNearestStation}>
        <i class="im im-location" />
        Wetterstation in meiner Nähe finden
    </a>

    <hr />
    <table>

        <tr>
            <th class="pr-4">Ausgewählte Station:</th>
            <td>{station.name}, {station.state}</td>
        </tr>
        <tr>
            <th>{$msg.timerange}:</th>
            <td>{station.from.getFullYear()} - {station.to.getFullYear()}</td>
        </tr>
        <tr>
            <th>{$msg.location}:</th>
            <td>
                <a
                    target="_blank"
                    href="https://www.openstreetmap.org/#map=19/{station.lat}/{station.lon}">
                    {(+station.lat).toFixed(2)}, {(+station.lon).toFixed(2)}
                </a>
            </td>
        </tr>
        <tr>
            <th>{$msg.altitude}:</th>
            <td>{station.altitude}m</td>
        </tr>
    </table>

{/await}
