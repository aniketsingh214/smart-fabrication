import { test,expect } from '@playwright/test';
// Unrelated browsing tests exercise the explicitly dismissed welcome state.
test.beforeEach(async({context})=>{await context.addInitScript(()=>sessionStorage.setItem('sf:visitor-dismissed','1'));});
async function setup({context,request,baseURL}:{context:import('@playwright/test').BrowserContext;request:import('@playwright/test').APIRequestContext;baseURL?:string},withCart=false){
 const response=await request.get('/api/v1/products?limit=2');expect(response.ok()).toBe(true);const {data}=await response.json();expect(data.length).toBe(2);const [a,b]=data;
 const wishlist=[a,{...a},b];const cart=withCart?[{...a,id:'test-cart-line',product_id:a.id,quantity:1}]:[];
 await context.addCookies([{name:'sf_locale',value:'en',url:baseURL!}]);
 await context.addInitScript(({wishlist,cart})=>{if(!sessionStorage.getItem('shop-count-fixture')){localStorage.setItem('sf_wishlist_items_v1',JSON.stringify(wishlist));localStorage.setItem('sf_cart_items_v1',JSON.stringify(cart));sessionStorage.setItem('shop-count-fixture','1');}},{wishlist,cart});return {a,b};
}
test('wishlist restores only distinct designs and preserves removals after reload',async({context,request,baseURL,page})=>{
 const {a}=await setup({context,request,baseURL});await page.goto('/wishlist');await expect(page.getByRole('button',{name:'Open wishlist (2 items)',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sf_wishlist_items_v1')!).length)).toBe(2);
 await page.goto('/catalog');await page.getByRole('button',{name:`Remove ${a.name} from wishlist`,exact:true}).first().click();await expect(page.getByRole('button',{name:'Open wishlist (1 items)',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Open wishlist (1 items)',exact:true})).toBeVisible();
});
test('quantity changes retain one cart badge entry; only a new design increases the count',async({context,request,baseURL,page})=>{
 const {a,b}=await setup({context,request,baseURL},true);await page.goto('/catalog');await page.getByRole('button',{name:'Open cart (1 items)',exact:true}).click();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Increase quantity',exact:true}).click();
 await page.getByRole('button',{name:'Close cart',exact:true}).click();await expect(page.getByRole('button',{name:'Open cart (1 items)',exact:true})).toBeVisible();
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('sf_cart_items_v1')!));expect(first.length).toBe(1);expect(first[0].quantity).toBe(4);expect(first[0].product_id).toBe(a.id);
 await page.getByRole('button',{name:`Add ${b.name} to cart`,exact:true}).first().click();await page.getByRole('button',{name:'Close cart',exact:true}).click();await expect(page.getByRole('button',{name:'Open cart (2 items)',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Open cart (2 items)',exact:true})).toBeVisible();const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('sf_cart_items_v1')!));expect(cart.find((item:{product_id:string})=>item.product_id===a.id).quantity).toBe(4);
});
test('moving wishlist designs to cart in one action retains every unique design',async({context,request,baseURL,page})=>{
 const {a,b}=await setup({context,request,baseURL});await page.goto('/wishlist');await page.getByRole('button',{name:/Move All to Cart/i}).click();
 await expect(page.getByRole('button',{name:'Close cart',exact:true})).toBeVisible();await page.getByRole('button',{name:'Close cart',exact:true}).click();
 await expect(page.getByRole('button',{name:'Open cart (2 items)',exact:true})).toBeVisible();const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('sf_cart_items_v1')!));expect(cart.map((item:{product_id:string})=>item.product_id).sort()).toEqual([a.id,b.id].sort());
});
