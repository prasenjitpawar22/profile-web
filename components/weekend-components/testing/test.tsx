"use client";
import React from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  RowData,
} from "@tanstack/react-table";
import { makeData, Person } from "./makeData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    isCellEdited: (rowIndex: number, columnId: string) => boolean;
  }
}

// const defaultColumn: Partial<ColumnDef<Person>> = {
//   cell: ({ getValue, row: { index }, column: { id }, table, cell }) => {
//     const initialValue = getValue();
//     const [value, setValue] = React.useState(initialValue);

//     const onBlur = () => {
//       if (initialValue !== value) table.options.meta?.updateData(index, id, value);
//     };

//     React.useEffect(() => {
//       setValue(initialValue);
//     }, [initialValue]);

//     // Determine if the cell is edited
//     const isEdited = table.options.meta?.isCellEdited(index, id);

//     return (
//       <input
//         value={value as string}
//         onChange={(e) => setValue(e.target.value)}
//         onBlur={onBlur}
//         className={cn(isEdited && 'bg-green-400')}
//       />
//     );
//   },
// };

function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  React.useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}


const options = [
  { value: "apple", label: "Option 1" },
  { value: "apple", label: "Option 2" },
  { value: "apple", label: "Option 3" },
];

export function Test() {
  const [data, setData] = React.useState(() => makeData(1000));
  data.map((d) => console.log(d))
  const [editedCells, setEditedCells] = React.useState<Set<string>>(new Set());
  const originalData = React.useRef(data);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        header: "Fruit",
        accessorKey: "fruit",
        cell: ({ row: { index }, column: { id }, table }) => {
          const currentValue = table.getRowModel().rows[index]?.original.fruit || [];
          const handleChange = (selectedOptions: any) => {
            const values = selectedOptions ? selectedOptions : '';
            table.options.meta?.updateData(index, id, values);
          };

          // Determine if the cell is edited
          const isEdited = table.options.meta?.isCellEdited(index, id);

          return (
            <Select value={currentValue as string} onValueChange={handleChange} >
              <SelectTrigger
                className={cn(isEdited ? 'bg-green-200' : '', 'w-40')}>
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="blueberry">Blueberry</SelectItem>
                  <SelectItem value="grapes">Grapes</SelectItem>
                  <SelectItem value="pineapple">Pineapple</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: 'active',
        header: 'Active',
        cell: ({ cell, column: { id }, getValue, row: { index } }) => {
          const currentValue = table.getRowModel().rows[index]?.original.active
          const handleChange = (selectedOptions: boolean) => {
            const values = selectedOptions
            table.options.meta?.updateData(index, id, values);
          };

          const isEdited = table.options.meta?.isCellEdited(index, id);

          return (
            <Checkbox checked={currentValue} onCheckedChange={handleChange}
              className={cn(isEdited && 'bg-green-200 data-[state=checked]:bg-green-200 data-[state=checked]:text-primary ',
              )} />
          )
        }
      },
      {
        accessorKey: 'town',
        header: 'Town',
        cell: ({ cell, column: { id }, getValue, row: { index } }) => {
          const currentValue = table.getRowModel().rows[index]?.original.town

          const handleChange = (selectedOptions: string) => {
            const values = selectedOptions
            table.options.meta?.updateData(index, id, values);
          };

          const isEdited = table.options.meta?.isCellEdited(index, id);

          return <Input value={currentValue} onChange={(e) => handleChange(e.target.value)}
            className={cn(isEdited && 'bg-green-200', 'w-fit')}
          />
        }
      }
    ],
    []);

  const table = useReactTable({
    data,
    columns,
    // defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              // Add to edited cells
              setEditedCells((prev) => {
                const newSet = new Set(prev);
                newSet.add(`${rowIndex}-${columnId}`);
                return newSet;
              });

              return {
                ...row,
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
      isCellEdited: (rowIndex: number, columnId: string) => {
        return editedCells.has(`${rowIndex}-${columnId}`);
      },
    },
  });

  const resetData = () => {
    setData(originalData.current);
    setEditedCells(new Set());
  };

  return (
    <div className='bg-slate-50 py-6 w-full relative h-fit gap-4 items-center flex-col px-4 flex rounded-md shadow border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div>
        <button onClick={resetData}>Reset</button>
      </div>
    </div>
  );
}
