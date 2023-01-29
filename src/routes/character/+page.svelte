<script lang="ts">
import Modal from '$lib/Modal.svelte';
import { roll } from '$lib/rolling/roll';
import Name from "$lib/sheet/Name.svelte";
import Card from "$lib/sheet/Card.svelte";
    import type { Character } from '$lib/types';

let dieRoll = 0;
let dieLabel = '';

const character: Character = {
  name: 'Choppy Pete',
  pronouns: 'he/them',
  grit: { current: 4, max: 4 },
  str: { current: 8, max: 8 },
  dex: { current: 4, max: 4 },
  wil: { current: 6, max: 6 },
  statuses: new Set<string>(),
  equipment: [],
  calling: { name: 'Devoted' },
  abilities: [],
  eulogy: 'He is a fine warrior.',
  xp: 0,
  spells: [],
  rituals: [],
  notes: '',
};

function showRoll(sides: number) {
  dieRoll = roll(sides);
  dieLabel = `d${sides} = ${dieRoll}`;
  console.log(`d${sides} =`, dieRoll);
}

function closeModal() {
  dieRoll = 0;
}
</script>
<svelte:head>
  <title>Demo Brighter Worlds character sheet</title>
</svelte:head>
<Modal on:close={closeModal} show={dieRoll > 0} label={dieLabel}/>
<div class="relative flex min-h-screen flex-col justify-start overflow-hidden bg-gray-50 dark:bg-gray-800 py-6 px-4 gap-4">
  <!-- <img src="/img/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" /> -->
  <div class="absolute inset-0 bg-[url(/img/grid.svg)] dark:invert bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="relative justify-self-center text-center">
      <h1 class="text-4xl font-title">Brighter Worlds</h1>
      <span class="block font-symbol text-6xl h-4 relative -top-6 text-purple-500">j</span>
    </div>
    <Name />
    <div class="relative overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5  flex flex-col gap-6">
      <div class="px-4 py-5 sm:px-6 flex flex-col gap-4">
        <div class="grid grid-cols-8 items-center">
          <div class="font-subtitle text-2xl col-span-2">Grit</div>
          <div class="col-span-2 relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-12"><path fill="currentColor" d="M384 32C419.3 32 448 60.65 448 96V416C448 451.3 419.3 480 384 480H64C28.65 480 0 451.3 0 416V96C0 60.65 28.65 32 64 32H384zM384 64H64C46.33 64 32 78.33 32 96V416C32 433.7 46.33 448 64 448H384C401.7 448 416 433.7 416 416V96C416 78.33 401.7 64 384 64z"/></svg>
            <span class="absolute font-subtitle text-4xl w-12 text-center top-[40%] -translate-y-1/2 leading-none">4</span>
          </div>
          <span class="text-2xl">/</span>
          <span class="text-3xl w-6 text-center font-subtitle">4</span>
          <div class="flex-1 text-right col-span-2">
            <button type="button" class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-0.25 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-6"><path fill="currentColor" d="M352 256C352 238.3 366.3 224 384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256zM192 256C192 238.3 206.3 224 224 224C241.7 224 256 238.3 256 256C256 273.7 241.7 288 224 288C206.3 288 192 273.7 192 256zM96 256C96 273.7 81.67 288 64 288C46.33 288 32 273.7 32 256C32 238.3 46.33 224 64 224C81.67 224 96 238.3 96 256z"/></svg></button>
          </div>
        </div>

        <div class="grid grid-cols-8 items-center">
          <div class="font-subtitle text-2xl col-span-2">STR</div>
          <div class="col-span-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-12"><path fill="currentColor" d="M512 256c0-8.643-3.305-17.32-9.868-23.88l-222.2-222.3C273.3 3.26 264.6 0 256 0S238.7 3.26 232.1 9.887L9.868 232.1C3.305 238.7 0 247.4 0 256s3.305 17.27 9.868 23.84l222.2 222.3C238.7 508.7 247.2 512 256 512s17.26-3.26 23.89-9.887l222.2-222.3C508.7 273.4 512 264.7 512 256zM239.1 464.9L61.23 285.9l178.8 76.64V464.9zM239.1 327.8L43.72 243.7L239.1 47.26V327.8zM272 464.9v-102.3l178.8-76.64L272 464.9zM272 327.8v-280.6L468.3 243.7L272 327.8z"/></svg></div>
          <span class="text-2xl">/</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-6"><path fill="currentColor" d="M512 256c0-8.643-3.305-17.32-9.868-23.88l-222.2-222.3C273.3 3.26 264.6 0 256 0S238.7 3.26 232.1 9.887L9.868 232.1C3.305 238.7 0 247.4 0 256s3.305 17.27 9.868 23.84l222.2 222.3C238.7 508.7 247.2 512 256 512s17.26-3.26 23.89-9.887l222.2-222.3C508.7 273.4 512 264.7 512 256zM239.1 464.9L61.23 285.9l178.8 76.64V464.9zM239.1 327.8L43.72 243.7L239.1 47.26V327.8zM272 464.9v-102.3l178.8-76.64L272 464.9zM272 327.8v-280.6L468.3 243.7L272 327.8z"/></svg>
          <div class="flex-1 text-right col-span-2">
            <button type="button" class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-0.25 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-6"><path fill="currentColor" d="M352 256C352 238.3 366.3 224 384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256zM192 256C192 238.3 206.3 224 224 224C241.7 224 256 238.3 256 256C256 273.7 241.7 288 224 288C206.3 288 192 273.7 192 256zM96 256C96 273.7 81.67 288 64 288C46.33 288 32 273.7 32 256C32 238.3 46.33 224 64 224C81.67 224 96 238.3 96 256z"/></svg></button>
          </div>
        </div>

        <div class="grid grid-cols-8 items-center">
          <div class="font-subtitle text-2xl col-span-2">DEX</div>
          <div class="col-span-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-12"><path fill="currentColor" d="M512 309.1c0-7.05-2.318-14.15-7.127-20.07l-224-277.1C274.5 3.1 265.2 0 256 0C246.8 0 237.5 3.1 231.1 11.88l-224 277.1C2.318 294.9 0 302 0 309.1c0 9.625 4.319 19.15 12.62 25.43l224 170.1C242.4 509.9 249.1 512 256 512c6.875 0 13.62-2.135 19.37-6.51l224-170.1C507.7 328.2 512 318.7 512 309.1zM32.01 309.1L240 51.75v416L32.01 309.1zM271.1 467.9v-416l207.1 257.3L271.1 467.9z"/></svg></div>
          <span class="text-2xl">/</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-6"><path fill="currentColor" d="M512 309.1c0-7.05-2.318-14.15-7.127-20.07l-224-277.1C274.5 3.1 265.2 0 256 0C246.8 0 237.5 3.1 231.1 11.88l-224 277.1C2.318 294.9 0 302 0 309.1c0 9.625 4.319 19.15 12.62 25.43l224 170.1C242.4 509.9 249.1 512 256 512c6.875 0 13.62-2.135 19.37-6.51l224-170.1C507.7 328.2 512 318.7 512 309.1zM32.01 309.1L240 51.75v416L32.01 309.1zM271.1 467.9v-416l207.1 257.3L271.1 467.9z"/></svg>
          <div class="flex-1 text-right col-span-2">
            <button type="button" class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-0.25 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-6"><path fill="currentColor" d="M352 256C352 238.3 366.3 224 384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256zM192 256C192 238.3 206.3 224 224 224C241.7 224 256 238.3 256 256C256 273.7 241.7 288 224 288C206.3 288 192 273.7 192 256zM96 256C96 273.7 81.67 288 64 288C46.33 288 32 273.7 32 256C32 238.3 46.33 224 64 224C81.67 224 96 238.3 96 256z"/></svg></button>
          </div>
        </div>

        <div class="grid grid-cols-8 items-center">
          <div class="font-subtitle text-2xl col-span-2">WIL</div>
          <div class="col-span-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-12"><path fill="currentColor" d="M431.9 116.1l-192-111.9C235 1.438 229.5 0 224 0S213 1.438 208.1 4.25l-192 111.9C6.125 121.1 0 132.7 0 144.5v223c0 11.75 6.125 22.48 16.12 28.36l192 111.9C213 510.6 218.5 512 224 512s11-1.438 15.88-4.25l192-111.9C441.9 390 448 379.3 448 367.5V144.5C448 132.7 441.9 121.1 431.9 116.1zM224 32.1l175.8 102.9L224 237.5l-176.1-102.8L224 32.1zM32.25 162.6L208 265.1v205.4L32 367.5L32.25 162.6zM240 470.9V265.1L416 162.5l-.25 205.8L240 470.9z"/></svg></div>
          <span class="text-2xl">/</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-6"><path fill="currentColor" d="M431.9 116.1l-192-111.9C235 1.438 229.5 0 224 0S213 1.438 208.1 4.25l-192 111.9C6.125 121.1 0 132.7 0 144.5v223c0 11.75 6.125 22.48 16.12 28.36l192 111.9C213 510.6 218.5 512 224 512s11-1.438 15.88-4.25l192-111.9C441.9 390 448 379.3 448 367.5V144.5C448 132.7 441.9 121.1 431.9 116.1zM224 32.1l175.8 102.9L224 237.5l-176.1-102.8L224 32.1zM32.25 162.6L208 265.1v205.4L32 367.5L32.25 162.6zM240 470.9V265.1L416 162.5l-.25 205.8L240 470.9z"/></svg>
          <div class="flex-1 text-right col-span-2">
            <button type="button" class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-0.25 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-6"><path fill="currentColor" d="M352 256C352 238.3 366.3 224 384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256zM192 256C192 238.3 206.3 224 224 224C241.7 224 256 238.3 256 256C256 273.7 241.7 288 224 288C206.3 288 192 273.7 192 256zM96 256C96 273.7 81.67 288 64 288C46.33 288 32 273.7 32 256C32 238.3 46.33 224 64 224C81.67 224 96 238.3 96 256z"/></svg></button>
          </div>
        </div>
        
        <div>
          <div class="flex items-center">
            <button type="button" class="inline-flex items-center rounded border border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="-ml-0.5 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500"><path fill="currentColor" d="M35.2 126.3c4.1 1.1 8.4 1.7 12.8 1.7c26.5 0 48-21 48-47c0-5-1.8-11.3-4.6-18.1c-.3-.7-.6-1.4-.9-2.1c-8.9-20.2-26.5-44.9-36-57.5c-3.2-4.4-9.6-4.4-12.8 0C28.6 20.6 0 61 0 81c0 21.7 14.9 39.8 35.2 45.3zM256 0c-51.4 0-99.3 15.2-139.4 41.2c1.5 3.1 3 6.2 4.3 9.3c3.4 8 7.1 19 7.1 30.5c0 44.3-36.6 79-80 79c-9.6 0-18.8-1.7-27.4-4.8C7.3 186.2 0 220.2 0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM195.9 410.7c-5.9 6.6-16 7.1-22.6 1.2s-7.1-16-1.2-22.6C188.2 371.4 216.3 352 256 352s67.8 19.4 83.9 37.3c5.9 6.6 5.4 16.7-1.2 22.6s-16.7 5.4-22.6-1.2c-11.7-13-31.6-26.7-60.1-26.7s-48.4 13.7-60.1 26.7zM96 272c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16zm208-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H304c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>
            Deprived
          </button>
          </div>
        </div>
      </div>
    </div>
    <div class="relative divide-y divide-gray-200 dark:divide-gray-600 overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5">
      <div class="px-4 py-5 sm:px-6">
        <div class="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
          <div class="ml-4 mt-4">
            <h3 class="text-xl font-subtitle leading-6">Equipment</h3>
            <p class="mt-1 text-sm text-gray-500">More than two bulky items sets your Grit to 0.</p>
          </div>
          <div class="ml-4 mt-4 flex-shrink-0">
            <div class="flex gap-4 items-center">
              <div class="relative">
                <div class="absolute w-full text-center text-4xl font-title top-[40%] -translate-y-1/2 leading-none">2</div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-12"><path fill="currentColor" d="M231 7.838C247 1.065 265.1 1.066 281 7.84L457.7 82.79C479.7 92.12 496.2 113.8 496 139.1C495.5 239.2 454.7 420.7 282.4 503.2C265.7 511.1 246.3 511.1 229.6 503.2C57.26 420.7 16.49 239.2 16 139.1C15.87 113.8 32.32 92.12 54.3 82.79L231 7.838zM268.5 37.3C260.5 33.91 251.5 33.91 243.5 37.3L66.79 112.3C55.51 117 47.94 127.7 48 139.8C48.46 233.8 87.33 399.6 243.4 474.3C251.4 478.1 260.6 478.1 268.6 474.3C424.7 399.6 463.6 233.8 464 139.8C464.1 127.7 456.5 117 445.2 112.3L268.5 37.3z"/></svg>
              </div>
              <div><button type="button" class="relative inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-2 text-sm font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-6"><path fill="currentColor" d="M272 240H496C504.8 240 512 247.2 512 256C512 264.8 504.8 272 496 272H272V496C272 504.8 264.8 512 255.1 512C247.2 512 239.1 504.8 239.1 496V272H16C7.164 272 0 264.8 0 256C0 247.2 7.164 240 16 240H239.1V16C239.1 7.164 247.2 0 255.1 0C264.8 0 272 7.164 272 16V240z"/></svg></button></div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-4 py-5 sm:p-6">
        <div>
          <div class="flow-root">
            <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
              <li class="py-3">
                <div class="flex items-center space-x-4">

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">Colorful Rapier</p>
                  </div>
                  <div class="flex gap-2 items-center">
                    <button class="inline-flex items-center text-sm font-medium leading-5" on:click={() => showRoll(6)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-5"><path fill="currentColor" d="M431.9 116.1l-192-111.9C235 1.438 229.5 0 224 0S213 1.438 208.1 4.25l-192 111.9C6.125 121.1 0 132.7 0 144.5v223c0 11.75 6.125 22.48 16.12 28.36l192 111.9C213 510.6 218.5 512 224 512s11-1.438 15.88-4.25l192-111.9C441.9 390 448 379.3 448 367.5V144.5C448 132.7 441.9 121.1 431.9 116.1zM224 32.1l175.8 102.9L224 237.5l-176.1-102.8L224 32.1zM32.25 162.6L208 265.1v205.4L32 367.5L32.25 162.6zM240 470.9V265.1L416 162.5l-.25 205.8L240 470.9z"/></svg></button>
                  </div>
                </div>
              </li>

              <li class="py-3">
                <div class="flex items-center space-x-4">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">Plate Mail</p>
                  </div>
                  <div class="flex gap-2 items-center">
                    <span class="inline-flex items-center rounded-full dark:bg-purple-100 px-2.5 py-0.5 text-xs font-medium dark:text-purple-800 bg-purple-800 text-purple-100">Bulky</span>
                  </div>
                </div>
              </li>

              <li class="py-3">
                <div class="flex items-center space-x-4">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">Old fashioned Cloak</p>
                  </div>
                  <div>
                    
                  </div>
                </div>
              </li>

              <li class="py-3">
                <div class="flex items-center space-x-4">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">Flexible 10-foot pole</p>
                  </div>
                  <div>
                    
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="relative divide-y divide-gray-200 dark:divide-gray-600 overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5">
      <div class="px-4 py-5 sm:px-6">
        <div class="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
          <div class="ml-4 mt-4">
            <h3 class="text-xl font-subtitle leading-6">Calling</h3>
            <div class="relative mt-1">
              <input id="combobox" type="text" class="w-full rounded-md border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 py-2 pl-3 pr-12 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" role="combobox" aria-controls="options" aria-expanded="false" value="Devoted">
              <button type="button" class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                <!-- Heroicon name: mini/chevron-up-down -->
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
                </svg>
              </button>

              <ul class="hidden absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" id="options" role="listbox">
                <!--
                  Combobox option, manage highlight styles based on mouseenter/mouseleave and keyboard navigation.

                  Active: "text-white bg-indigo-600", Not Active: "text-gray-900"
                -->
                <li class="relative cursor-default select-none py-2 pl-8 pr-4 text-gray-900" id="option-0" role="option" tabindex="-1">
                  <!-- Selected: "font-semibold" -->
                  <span class="block truncate">Leslie Alexander</span>

                  <!--
                    Checkmark, only display for selected option.

                    Active: "text-white", Not Active: "text-indigo-600"
                  -->
                  <span class="absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600">
                    <!-- Heroicon name: mini/check -->
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </li>

                <!-- More items... -->
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="h-full">
        <div class="h-full">
          <textarea rows="4" name="comment" id="comment" class="block w-full rounded-b-lg border-0 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-full px-4 py-5 sm:p-6"></textarea>
        </div>
      </div>
    </div>
    <Card title="Eulogy / Notes">
      <div class="h-full">
        <div id="eulogy" class="block min-h-[4rem] w-full dark:bg-gray-900 border-0 shadow-sm sm:text-sm">{character.eulogy}</div>
      </div>
    </Card>
    <Card title="Spells">
      <div class="h-full">
        <div id="spells" class="block min-h-[4rem] w-full dark:bg-gray-900 border-0 shadow-sm sm:text-sm"></div>
      </div>
    </Card>
    <Card title="Rituals">
      <div class="h-full">
        <div id="rituals" class="block min-h-[4rem] w-full dark:bg-gray-900 border-0 shadow-sm sm:text-sm"></div>
      </div>
    </Card>
  </div>
</div>