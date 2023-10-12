export const SheetHeader = ({
  title,
  searchString,
}: {
  title: string;
  searchString: string;
}) => {
  return (
    <header>
      <h1>
        <input
          type="text"
          value={title}
          name="sheet_title"
          title="Spreadsheet title"
          aria-label="Spreadsheet title"
        />
      </h1>
      <form>
        <input
          type="text"
          placeholder="Search"
          value={searchString}
          name="search_string"
          title="Search in spreadsheet"
          aria-label="Search in spreadsheet"
        />
      </form>
    </header>
  );
};
