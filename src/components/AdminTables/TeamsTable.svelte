<script lang="ts">
  import { DataHandler, Datatable, Th, ThFilter } from "@vincjo/datatables";

  export let data: any[] = [];

  let tableElement: HTMLElement | undefined;

  const handler = new DataHandler(data, { rowsPerPage: 25 });
  const rows = handler.getRows();

  $: data, update();

  const update = () => {
    if (tableElement) {
      const scrollTop = (tableElement.parentNode as HTMLElement).scrollTop;
      handler.setRows(data);
      setTimeout(() => {
        (tableElement!.parentNode as HTMLElement).scrollTop = scrollTop;
      }, 2);
    }
  };
  function formatDateTime(date: Date) {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  // console.log(data[0]);
</script>

<Datatable {handler}>
  <table class="w-full" bind:this={tableElement}>
    <thead>
      <tr>
        <Th {handler} align="center" orderBy="id">ID</Th>
        <Th {handler} align="center" orderBy="name">Name</Th>
        <Th {handler} align="center" orderBy="points">Points</Th>
        <Th {handler} align="center" orderBy="currentQuestionId"
          >Current Question ID</Th
        >
        <Th
          {handler}
          align="center"
          orderBy={(row) =>
            row?.levelUpTime
              ? formatDateTime(new Date(row.levelUpTime))
              : "null"}>Level Up Time</Th
        >
      </tr>
      <tr>
        <ThFilter align="center" {handler} filterBy="id" />
        <ThFilter align="center" {handler} filterBy="name" />
        <ThFilter align="center" {handler} filterBy="points" />
        <ThFilter align="center" {handler} filterBy="currentQuestionId" />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) =>
            row?.levelUpTime
              ? formatDateTime(new Date(row.levelUpTime))
              : "null"}
        />
      </tr>
    </thead>
    <tbody>
      {#each $rows as row}
        <tr
          id={row.id}
          class="cursor-pointer"
          on:click={() => {
            window.location.href = `/admin/teams/${row.id}`;
          }}
        >
          <td data-content={row.id} class="w-8" id="id">{row.id}</td>
          <td data-content={row.name} class="capitalize" id="name"
            >{row.name}</td
          >
          <td data-content={row.points} id="points">{row.points}</td>
          <td data-content={row.currentQuestionId} id="currentQuestionId"
            >{row.currentQuestionId}</td
          >
          <td
            data-content={row.levelUpTime ? new Date(row.levelUpTime) : "null"}
            >{row.levelUpTime
              ? formatDateTime(new Date(row.levelUpTime))
              : "null"}</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</Datatable>

<style>
  /* thead {
    background: #fff;
  } */

  tbody tr {
    transition: all, 0.2s;
  }
  tbody tr:hover {
    background: #f0f0f0;
  }
  @media (prefers-color-scheme: dark) {
    tbody tr:hover {
      background: #333;
    }
  }

  td {
    padding: 0.5rem;
    text-align: center;
  }

  #team:not([data-content="null"]) {
    text-transform: capitalize;
  }

  td[data-content="null"]:before {
    content: "null";
    color: #656565;
    font-style: italic;
  }

  td[data-content="null"] {
    color: #0000;
    user-select: none;
  }
</style>
