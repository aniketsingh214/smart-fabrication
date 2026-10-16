// Read-only DTOs use the runtime's explicit projection plus captured column types.
// Database metadata contains schema names/types, never customer rows or secrets.
export function resourceReadSchema(resource, projection, columns) {
 const properties={};
 for(const field of projection.split(',')){
  const column=columns.find(item=>item.table_name===resource.table&&item.column_name===field);
  if(!column)throw new Error(`Refresh schema metadata: missing ${resource.table}.${field}`);
  let schema;
  switch(column.data_type){
   case 'uuid':schema={type:'string',format:'uuid'};break;
   case 'timestamp with time zone':case 'timestamp without time zone':schema={type:'string',format:'date-time'};break;
   case 'date':schema={type:'string',format:'date'};break;
   case 'boolean':schema={type:'boolean'};break;
   case 'bigint':case 'integer':case 'smallint':schema={type:'integer'};break;
   case 'numeric':case 'double precision':case 'real':schema={type:'number'};break;
   case 'json':case 'jsonb':schema={};break;
   case 'ARRAY':schema={type:'array',items:{}};break;
   default:schema={type:'string'};
  }
  properties[field]=column.is_nullable==='YES'?{anyOf:[schema,{type:'null'}]}:schema;
 }
 return {type:'object',additionalProperties:false,required:Object.keys(properties),properties};
}
