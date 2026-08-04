const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/app/(dashboard)/events/new/page.tsx');
const destPath = path.join(__dirname, 'src/app/(dashboard)/events/[id]/edit/page.tsx');

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Rename Component and add params and useEffect
content = content.replace('export default function CreateEventPage() {', 
`import { useEffect } from 'react'

export default function EditEventPage({ params }: { params: { id: string } }) {
  // unwrap params since Next.js 15+ may pass promises
  const { id } = params;
`);

// 2. Add useEffect to fetch data
content = content.replace('const [imagePreview, setImagePreview] = useState<string | null>(null)',
`const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvent() {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
      if (data) {
        setFormData({
          name: data.name || '',
          location: data.location || '',
          type: data.type || '',
          banner: data.banner || '',
          description: data.description || ''
        })
        if (data.start_date || data.date) setStartDate(new Date(data.start_date || data.date))
        if (data.end_date) setEndDate(new Date(data.end_date))
        if (data.banner) setImagePreview(data.banner)
      }
    }
    fetchEvent()
  }, [id, supabase])`);

// 3. Update insert to update
content = content.replace('.from(\'events\')\n        .insert({',
`.from('events')
        .update({`);

// 4. Add eq to update
content = content.replace('created_by: user.id\n        })',
`created_by: user.id
        })
        .eq('id', id)`);

// 5. Update UI text
content = content.replace('Create New Event', 'Edit Event');
content = content.replace('Add a new event to the platform', 'Update event details');
content = content.replace('Creating Event...', 'Saving Changes...');
content = content.replace('Publish Event', 'Save Changes');

fs.writeFileSync(destPath, content);
console.log('Edit page created');
