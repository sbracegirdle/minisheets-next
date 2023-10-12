import { SheetHeader } from "@/components/SheetHeader";
import { prisma } from "@/db";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { slug: string } }) {
  let result = await prisma.sheet.findFirst({
    where: { id: params.slug },
  });

  if (!result) {
    const columns = [
      {
        id: Math.random().toString(36).substring(2),
        name: "Column 1",
      },
      {
        id: Math.random().toString(36).substring(2),
        name: "Column 2",
      },
    ];

    // Create a new sheet
    result = await prisma.sheet.create({
      data: {
        id: params.slug,
        title: "New Sheet",
        // Prisma doesn't support JSON type yet for sqlite
        columns: JSON.stringify(columns),
        // Prisma doesn't support JSON type yet for sqlite
        data: JSON.stringify([
          {
            id: Math.random().toString(36).substring(2),
            [columns[0].id]: "Cell 1",
            [columns[1].id]: "Cell 2",
          },
          {
            id: Math.random().toString(36).substring(2),
            [columns[0].id]: "Cell 3",
            [columns[1].id]: "Cell 4",
          },
        ]),
      },
    });
  }

  // Parse data
  const data = JSON.parse(result.data || "[]");
  // Assert that data is an array of objects
  if (!Array.isArray(data) || !data.every((item) => typeof item === "object"))
    throw new Error("Invalid data");
  const columns = JSON.parse(result.columns || "[]");
  // Assert that columns is an array of objects
  if (
    !Array.isArray(columns) ||
    !columns.every((item) => typeof item === "object")
  )
    throw new Error("Invalid columns");

  // calculate footer values magically
  const footerValues = columns.map((col) => {
    const values = data.map((row) => row[col.id]);
    // If all values are strings containing numbers, sum them
    if (values.every((value) => typeof value === "string" && !isNaN(+value))) {
      const sum = values.reduce((a, b) => a + +b, 0);
      return {
        id: col.id,
        type: "sum",
        value: sum,
      };
    } else {
      return {
        id: col.id,
        type: "count",
        value: values.length,
      };
    }
  });

  async function saveCellValue(formData: FormData) {
    "use server";

    if (
      !formData.has("row_id") ||
      !formData.has("col_id") ||
      !formData.has("cell_value") ||
      // Plus they should be strings
      typeof formData.get("row_id") !== "string" ||
      typeof formData.get("col_id") !== "string" ||
      typeof formData.get("cell_value") !== "string"
    )
      throw new Error("Missing data");

    const colId: string = formData.get("col_id") as string;

    await prisma.sheet.update({
      data: {
        data: JSON.stringify([
          ...data.map(
            (r: { id: string; [x: string]: string | number | undefined }) => {
              if (r.id === formData.get("row_id")) {
                return {
                  ...r,
                  [colId]: formData.get("cell_value"),
                };
              } else {
                return r;
              }
            }
          ),
        ]),
      },
      where: {
        id: params.slug,
      },
    });

    // Revalidate and redirect
    revalidateTag("sheet"); // Update cached posts
    redirect(`/sheet/${params.slug}`); // Navigate to new route
  }

  return (
    <main>
      <SheetHeader title="Sheet Title" searchString="Search String" />

      <table>
        <thead>
          <tr>
            {columns?.map((col) => (
              <th key={col.id}>
                <input
                  type="text"
                  name="column_name"
                  value={col.name}
                  title="Edit column name"
                  aria-label="Edit column name"
                />
                <button
                  className="tertiary small"
                  title="Remove column"
                  aria-label="Remove column"
                >
                  x
                </button>
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data?.map((row) => (
            <tr key={row.id}>
              {columns?.map((col) => (
                <td key={row.id + "__" + col.id}>
                  <form action={saveCellValue}>
                    {/* hidden row and col ids */}
                    <input type="hidden" name="row_id" value={row.id} />
                    <input type="hidden" name="col_id" value={col.id} />
                    {/* cell value */}
                    <input
                      type="text"
                      name="cell_value"
                      value={row[col.id]}
                      title="Edit cell value"
                      aria-label="Edit cell value"
                      // on change, submit form
                      // onBlur={(event) => {
                      //   event.target.form?.dispatchEvent(
                      //     new Event("submit", { bubbles: true })
                      //   );
                      // }}
                    />
                  </form>
                </td>
              ))}
              <td>
                <button
                  className="small"
                  title="Delete row"
                  aria-label="Delete row"
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot id="">
          <tr>
            {footerValues?.map((footer) => {
              if (footer.type === "count") {
                return (
                  <td key={`${footer.type}__${footer.id}`}>
                    <em>Count: </em>
                    <span>{footer.value}</span>
                  </td>
                );
              } else {
                return (
                  <td key={`${footer.type}__${footer.id}`}>
                    <em>Sum: </em>
                    <span>{footer.value}</span>
                  </td>
                );
              }
            })}
          </tr>
        </tfoot>
      </table>
      <div>
        <button title="Add row" aria-label="add row">
          Add row
        </button>
        <button title="Add column" aria-label="add column">
          Add column
        </button>
      </div>
    </main>
  );
}
