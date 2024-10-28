<script lang="ts">
  import { DataHandler, Datatable, Th, ThFilter } from "@vincjo/datatables";

  export let data: any[] = [];

  let tableElement: HTMLElement | undefined;

  const handler = new DataHandler(data, { rowsPerPage: 25 });
  const rows = handler.getRows();

  handler.applySort({
    orderBy: "timestamp",
    direction: "desc",
  });

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
        <Th {handler} align="center" orderBy="level">Level</Th>
        <Th {handler} align="center" orderBy="message">Message</Th>
        <Th {handler} align="center" orderBy="namespace">Namespace</Th>
        <Th {handler} align="center" orderBy="priority">Priority</Th>
        <Th {handler} align="center" orderBy="timestamp">Timestamp</Th>
      </tr>
      <tr>
        <ThFilter align="center" {handler} filterBy="level" />
        <ThFilter align="center" {handler} filterBy="message" />
        <ThFilter align="center" {handler} filterBy="namespace" />
        <ThFilter align="center" {handler} filterBy="priority" />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) =>
            row?.timestamp ? formatDateTime(new Date(row.timestamp)) : "null"}
        />
      </tr>
    </thead>
    <tbody>
      {#each $rows as row}
        <tr
          id={row.id}
          on:click={() => {
            // window.location.href = `/admin/logs/${row.id}`;
          }}
        >
          <td data-content={row.level} class="w-8" id="level">{row.level}</td>
          <td data-content={row.message} id="message">{row.message}</td>
          <td data-content={row.namespace} id="namespace">{row.namespace}</td>
          <td data-content={row.priority} id="priority">{row.priority}</td>
          <td
            data-content={row.timestamp ? new Date(row.timestamp) : "null"}
            id="timestamp"
            >{row.timestamp
              ? formatDateTime(new Date(row.timestamp))
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
