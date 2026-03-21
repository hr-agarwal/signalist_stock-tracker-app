import RootGroupLayout from './(root)/layout';
import HomePage from './(root)/page';

// This makes the top-level "/" route use the same authenticated layout as the root group.
export default async function Page() {
    return (
        <RootGroupLayout>
            <HomePage />
        </RootGroupLayout>
    );
}
