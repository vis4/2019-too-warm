<script>
    import { csv } from 'd3-fetch';
    import { timeFormat } from 'd3-time-format';

    import { beforeUpdate, onMount } from 'svelte';
    import {
        maxDate,
        msg,
        language,
        minDate,
        contextMinYear,
        contextMaxYear,
        formatTemp,
        useFahrenheit
    } from './stores';

    import DataLoaded from './DataLoaded.svelte';
    import StationSelect from './partials/StationSelect.svelte';
    import TimeSelect from './partials/TimeSelect.svelte';
    import TemperatureDay from './TemperatureDay.svelte';
    import MonthlyAnomalies from './MonthlyAnomalies.svelte';
    import YearlyAnomalies from './YearlyAnomalies.svelte';

    const tfmtIntro = timeFormat($msg.introDateFormat);

    let data;

    $: console.log({data})

    onMount(() => load())

    $: stationShort = station ? station.name : '...';

    const parseRow = d => ({
        date: new Date(d.date),
        dateRaw: d.date,
        tMin: +d.TNK,
        tAvg: +d.TMK,
        tMax: +d.TXK
    });

    $: stationFrom = station ? station.from.getFullYear() : 1980;

    let promise;
    const load = () => {
        console.log('loading data', station);
        if (!station) return;
        promise = csv(
            `/blog/interactives/2019-too-warm/data/stations/${station.id}.csv`,
            parseRow
        ).then(res => {
            console.log('data loaded', res);
            data = res;
            return data;
        });
    };

    let _station;
    let _lang;
    let station = { id: '00430', from: new Date(1960,0,1)};
    let stations = [];

    $: dailyMaxDec18 = data ? data.find(d => d.dateRaw === '2019-12-18').tMax : '...';

    beforeUpdate(() => {
        if (station !== _station) {
            // new station selected!
            _station = station;
            data = false;
            load();
        }
        if (_lang !== $language) {
            document.querySelector('h1.posttitle').innerHTML = $msg.title;
            _lang = $language;
        }
    });

    $: loading = `<i class="fa fa-spinner fa-pulse fa-fw"></i> ${$msg.loading}...`;
</script>

<style>
    header {
        margin-bottom: 20px;
    }

    main {
        --hotter-color: #d00;
        --normal-color: #777;
        --colder-color: #09d;
        --context-color: #bbb;
        --white: #fff;
        --def-color: #c30;
        --tick-line: #d0d2d5;
        --tick: #6c757d;
        --bg: #eeeeee;
    }

    :global(.is-dark) main {
        --hotter-color: #e44d4d;
        --normal-color: #ccc;
        --colder-color: #09d;
        --white: #0f0e13;
        --context-color: #777;
        --def-color: #c30;
        --tick-line: #403f4a;
        --tick: #6c757d;
        --bg: #1c1b22;
    }

    @media (max-width: 400px) {
        main {
            padding: 1ex;
        }
    }

    main.story,
    header.story {
        max-width: 45rem;
        font-size: 18px;
        margin: 0 auto;
    }

    p.text-small {
        font-size: 15px;
        line-height: 22px;
    }
    .text-muted {
        color: var(--tick);
    }
    @media (min-device-width: 600px) {
        .only-mobile {
            display: none;
        }
    }

    @media (max-device-width: 600px) {
        .only-desktop {
            display: none;
        }
        .story p {
            font-size: 17px;
            line-height: 1.6;
        }
    }

    main[lang='de'] *[lang='en'] {
        display: none;
    }

    main[lang='en'] *[lang='de'] {
        display: none;
    }
</style>

<main lang={$language} class="story px2">

    <p class="p-2 text-center text-muted text-small" lang="de">
        <a class="text-reset" href="#/en" on:click|preventDefault={() => $language = 'en'}>Read this text in English</a>
        <br />
    </p>
    <p class="p-2 text-center text-muted text-small" lang="en">
        <a class="text-reset" href="#/de" on:click|preventDefault={() => $language = 'de'}>Diesen Text auf deutsch lesen</a>
        <br />
        <a
            class="text-reset"
            on:click|preventDefault={() => ($useFahrenheit = !$useFahrenheit)}
            href="#/en">
            (also click here if you
            <b>prefer temperatures in {$useFahrenheit ? 'Celsius' : 'Fahrenheit'}</b>
            )
        </a>
    </p>

    <p lang="de">
        Laut Deutschem Wetterdienst (DWD) war 2019 das
        <a
            href="https://www.dwd.de/DE/presse/pressemitteilungen/DE/2019/20191230_deutschlandwetter_jahr2019.pdf?__blob=publicationFile&v=3">
            drittwärmste Jahr in Deutschland
        </a>
        seit Beginn der regelmäßigen Messungen 1881 (hinter 2014 und 2018). Am 25. Juli wurde mit
        <b>{$formatTemp(42.6)}</b>
        ein neuer deutscher Hitzerekord aufgestellt, und lokale Rekorde wurden in fast allen
        Wetterstationen gemessen.
    </p>

    <p lang="en">
        According to Deutsche Wetterdienst (DWD), 2019 was the third hottest year in Germany since
        we started to measure temperatures regularly in 1881. On July 25 a new national record of
        <b>{$formatTemp(42.6)}</b>
        was measured, along with local records in most weather stations.
    </p>

    <p lang="de">
        Auch abseits von Rekordwerten war 2019 laut DWD "zu trocken, zu sonnig und vor allem wärmer
        als üblich". Aber wer sagt eigentlich was übliche oder "normale" Temperaturen sind?
    </p>

    <p lang="en">
        Aside from record temperatures, DWD described the year 2019 as "too dry, too sunny, and most
        of all warmer than usual". But who's to say what usual or "normal" temperatures are? How are
        they defined?
    </p>

    <p lang="de">
        Als Rechenbeispiel nehmen wir uns den 18. Dezember an der Wetterstation {stationShort}. Die
        Tageshöchsttemperatur lag an diesem Tag bei
        <b>{$formatTemp(dailyMaxDec18)}</b>
        . Um zu bestimmen welche Temperaturen "normal" für einen bestimmten Tag sind, berechnen
        Meterologen die Mittelwerte aus den Höchst- und tiefsttemperaturen am selben Datum in einem
        <b>Vergleichszeitraum</b>
        , zum Beispiel zwischen {$contextMinYear} und {$contextMaxYear - 1}.
    </p>

    <p lang="en">
        So let's take a look at a single day, December 18, at weather station {stationShort}. The
        daily maximum temperature was at
        <b>{$formatTemp(dailyMaxDec18)}</b>
        . Was that hotter than normal? To answer this question, meterologists compute averages of
        maximum and minimum temperatures on the same date over a
        <b>base period</b>
        , for instance between {$contextMinYear} and {$contextMaxYear - 1}.
    </p>

    {#if data}
        <h2 lang="de">Wie sich der "normale" Temperaturbereich errechnet</h2>
        <h2 lang="en">How "normal" temperature ranges are being calculated</h2>
        <p class="text-muted text-small mt0" lang="de">
            Jeder Balken zeigt die Temperaturspanne am 18.12. im jeweiligen Jahr (gemessen an der
            Wetterstation {stationShort}). Tipp: Du kannst den Vergleichszeitraum nach links und
            rechts verschieben.
        </p>
        <p class="text-muted text-small mt0" lang="en">
            Each bar shows the temperature range on December 18 in a given year (measured at weather
            station {stationShort}). Hint: You can move the base period to the left and right.
        </p>
        <TemperatureDay {data} />
    {:else}
        <p class="text-small text-muted">
            {@html loading}
        </p>
    {/if}

    <p lang="de">
        Ob ein Temperaturwert nun "höher als normal" ist, hängt also davon ab, mit welchem Zeitraum
        wir vergleichen (der Zeitraum im Diagramm lässt sich verschieben um den Effekt zu
        beobachten). Doch wie wir den Zeitraum auch verändern, das Tageshoch von
        <b>{dailyMaxDec18}°C</b>
        ist und bleibt ein Ausreißer für einen 18. Dezember, und damit "zu hoch".
    </p>

    <p lang="en">
        As we see, whether or not a given temperature is classified as "too hot" depends on the
        choice of the base period (you can move the base period in the above chart to see this
        effect). But no matter how we move the base period, the daily maximum of
        <b>{$formatTemp(dailyMaxDec18)}</b>
        will remain an outlier on a December 18, and therefor qualifies as "too hot".
    </p>

    <p lang="de">
        Natürlich war der 18. Dezember kein Einzelfall: Über das ganze Jahr hinweg gab es solche "zu
        heißen" Tage. Die folgende Grafik zeigt die an der Wetterstation {stationShort} gemessenen
        Temperaturwerte. Der hellgraue Bereich im Hintergrund zeigt die bisherigen Temperaturrekorde
        (an dieser Wetterstation) und die kleinen Pfeile weisen die neu aufgestellten
        Temperaturrekorde aus.
    </p>

    <p lang="en">
        Of course, the 18th of December was no isolated case. We can see these "too-hot" days
        throughout the entire year. The following graphic shows daily temperature measurements at
        the weather station {stationShort}. The area in light gray in the background shows past
        temperature records at this station, and the small arrows point to newly set records.
    </p>

    <h2 lang="de">Zu heiße Tage und Rekordtemperaturen über das ganze Jahr</h2>
    <h2 lang="en">Days too hot and temperature records all year round</h2>
    <p lang="de" class="text-muted text-small mt0">
        Das Diagramm zeigt tägliche Höchst- und Tiefstwerte der Lufttemperatur an der Wetterstation {station ? station.name : '...'}
        zwischen {tfmtIntro($minDate)} und {tfmtIntro($maxDate)}. Jeder Tag wird durch einen Balken
        dargestellt; ein Kreis zeigt die Tagesmitteltemperatur.
        <span class="only-mobile">
            Tipp: drehe dein Telefon seitwärts um einen längeren Zeitraum anzusehen!
        </span>
    </p>
    <p lang="en" class="text-muted text-small mt0">
        This chart shows daily highs and lows of air temperature at weather station {station ? station.name : '...'}
        between {tfmtIntro($minDate)} and {tfmtIntro($maxDate)}. Each day is represented by a bar,
        the daily mean temperature is displayed with a circle.
        <span class="only-mobile">Tipp: rotate your phone to see a longer time frame!</span>
    </p>
</main>

<main class="full-width" lang={$language}>
    {#if promise}
        {#await promise}
            <!-- promise is pending -->
            <p class="text-small text-muted">
                {@html loading}
            </p>
        {:then data}
            <DataLoaded {data} />
        {:catch error}
            <!-- promise was rejected -->
            <p>Something went wrong: {error.message}</p>
        {/await}
    {/if}
    <div class="row">
        <div class="col-md">
            <!-- <TimeSelect /> -->
        </div>
        <div class="col-md-auto">
            <img
                alt="reading instructions"
                style="width:300px; max-width: 100%;margin-bottom: 20px"
                src="/blog/images/2020/2019-too-warm-key-{$language}.png" />
        </div>
    </div>
</main>

<main class="story px2" lang={$language}>

    <p lang="de">
        Das vermehrte Aufkommen zu warmer Tage hat freilich nicht erst in diesem Jahr angefangen (du
        kannst dir mit der Monat/Jahr-Steuerung unter dem Diagramm ältere Messungen ansehen). Was
        wir sehen ist vielmehr die Fortsetzungen des Langzeittrends der letzten Jahrzehnte. Es lohnt
        sich daher einen Blick auf einen längeren Zeitraum zu werfen.
    </p>

    <p lang="en">
        The increasing frequency of days that are "too hot" certainly didn't start this year (you
        can browse through time using the year/month controls below the chart if you want). Rather,
        what we see is the continuation of a long-term trend over the last decades. Therefor it's
        worth taking a look at a longer time span
    </p>

    <p lang="de">
        Die folgende Grafik zeigt die Differenzen der Monatsmitteltemperaturem zum Monatsmittel im
        Vergleichszeitraum — auch bekannt als Temperaturanomalien — von {!station ? 1960 : Math.max(station.from.getFullYear(), 1960)}
        bis 2019. Die Rekordjahre 2019 und 2018 sind gut erkennbar, aber auch der Rekordwinter von
        2006/07 fällt ins Auge.
    </p>

    <p lang="en">
        The following chart shows the differences of average monthly temperatures to the long-term
        average over the base period — also known as temperature anomalies — between {!station ? 1960 : Math.max(station.from.getFullYear(), 1960)}
        and 2019. We can see the heat records from 2019 and 2018 but also the record winter of
        2006/07 is visible, too.
    </p>

    <h2 lang="de">Zu warme Monate werden immer häufiger</h2>
    <h2 lang="en">Too-hot months become more frequent</h2>
    <p lang="de" class="text-muted text-small mt0">
        Die Balken zeigen mittlere Temperaturabweichungen pro Monat gegenüber dem Monatsdurchschnitt
        im Vergleichszeitraum von {$contextMinYear} bis {$contextMaxYear - 1}). Zu warme Monate sind
        rot dargestellt, zu kalte sind blau.
    </p>
    <p lang="en" class="text-muted text-small mt0">
        Bars show temperature anomalies over the base period from {$contextMinYear} to {$contextMaxYear - 1}.
        Too-hot months are shown red, too-cold months are shown in blue.
    </p>
    {#if data}
        <MonthlyAnomalies {data} />
    {:else}
        <p class="text-small text-muted">
            {@html loading}
        </p>
    {/if}

    <p lang="de">
        Komprimiert man die Daten weiter zu einem einzigem Temperatur-Mittelwert pro Jahr lässt sich
        der Trend auch mathematisch berechnen und als Trendlinie darstellen. Die Stärke des Anstiegs
        ist unterschiedlich in jeder Wetterstation, aber ansteigen tut die Temperatur überall, von
        den
        <a href="#/{$language}/05792/zugspitze">Alpen</a>
        bis nach
        <a href="#/{$language}/02115/helgoland">Helgoland</a>
        in der Nordsee.
    </p>

    <p lang="en">
        If we compress the data further to yearly temperature averages we can compute the trend
        mathematically and visualize it as trend line. The slope of this line is different in each
        weather station, but temperatures are rising everywhere from the
        <a href="#/{$language}/05792/zugspitze">alps</a>
        in the South up to the Northern Sea island
        <a href="#/{$language}/02115/helgoland">Helgoland</a>
        .
    </p>
    <h2 lang="de">Die globale Erwärmung zeigt sich auch an der Wetterstation {stationShort}</h2>
    <h2 lang="en">Global warming is visible at weather station {stationShort}, too</h2>
    <p lang="de" class="text-muted text-small mt0">
        Die Balken zeigen jährliche Temperaturanomalien an der Wetterstation {stationShort}
        gegenüber dem Vergleichszeitraum von
        <b>{$contextMinYear} bis {$contextMaxYear - 1}).</b>
    </p>
    <p lang="en" class="text-muted text-small mt0">
        In this chart bars show yearly temperature anomalies at weather station {stationShort} over
        the base period from
        <b>{$contextMinYear} to {$contextMaxYear - 1}).</b>
    </p>
    {#if data}
        <YearlyAnomalies {data} />
    {:else}
        <p class="text-small text-muted">
            {@html loading}
        </p>
    {/if}

    <p lang="de">
        Auch hier ändert die Wahl des Vergleichszeitraums die Position der Grundline im Diagramm,
        und damit auch welche Balken in rot und welche in blau erscheinen. Aber sie hat keinen
        Einfluß auf den Anstieg der Trendlinie. Die Welt erwärmt sich, egal mit welcher Zeit wir
        vergleichen.
    </p>

    <p lang="en">
        Again, the choice of the base period will change the baseline for this chart, and with it
        some lines will turn from red to blue. But it won't change the slope of the trend line. The
        world is warming, no matter what time we compare it with.
    </p>

    <div class="form-inline mb-3">
        <b>{$msg.changePeriod}:</b>
        <input
            style="width:300px;max-width: 100%"
            class="ml-2 mr-2 form-control"
            type="range"
            min={stationFrom}
            max="1989"
            bind:value={$contextMinYear} />
        {$contextMinYear} - {$contextMaxYear}
    </div>

    <p lang="de">
        Alle Grafiken in diesem Artikel beziehen sich auf die Wetterstation
        <b>{station ? station.name : '...'} in {station ? station.state : '...'}</b>
        . Aber da der Klimawandel sich nicht auf einzelne Regionen beschränkt, lassen sich die
        selben Effekte auch in allen anderen deutschen Wetterstationen beobachten. Du kannst das
        folgende Formular benutzen, um die Daten einer der anderen {stations.length} Wetterstationen
        anzusehen, die mindestens tägliche Temperaturdaten zwischen 1980 und 2019 gesammelt haben.
    </p>
    <p lang="en">
        All charts in this article are referring to the weather station
        <b>{station ? station.name : '...'} in {station ? station.state : '...'}</b>
        . But since climate change is not limited to certain regions, the same effects can be seen
        in all other German weather stations. You can use the form below to change to any of the {stations.length}
        stations in Germany that collected daily temperature data between at least 1980 and 2019.
    </p>
    <!-- <div class="shadow-sm p-3 mb-5 bg-white rounded" style="max-width: 30rem">
        <StationSelect bind:station bind:stations />
    </div> -->
    <h2 lang="de">Quellenangabe</h2>
    <h2 lang="en">Sources</h2>
    <p lang="de">
        Alle in diesem Artikel verwendeten Daten stammen vom
        <b>
            <a href="https://www.dwd.de/DE/">Deutschen Wetterdienst</a>
        </b>
        , der diese dankenswerterweise als
        <a href="https://www.dwd.de/DE/klimaumwelt/cdc/cdc_node.html">OpenData</a>
        zur Verfügung stellt. Weiterhin befindet sich der
        <a href="https://github.com/vis4/2019-too-warm">komplette Quellcode</a>
        für diesen Artikel und die darin enthaltenen Grafiken auf
        <a href="https://github.com/vis4/2019-too-warm">Github</a>
        .
    </p>
    <p lang="en">
        All data used in this articles comes from
        <b>
            <a href="https://www.dwd.de/EN/">Deutschen Wetterdienst</a>
        </b>
        , which released them as as
        <a href="https://www.dwd.de/DE/klimaumwelt/cdc/cdc_node.html">open data</a>
        for free. You can also find the
        <a href="https://github.com/vis4/2019-too-warm">full source code</a>
        for this article and all contained graphics on
        <a href="https://github.com/vis4/2019-too-warm">Github</a>
        .
    </p>
</main>
