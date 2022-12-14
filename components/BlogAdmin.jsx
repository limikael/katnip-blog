import {katnip, A, ItemList, setLocation, buildUrl, BsAlert, BsLoader, useForm,
		useApiFetch, apiFetch, useCounter, useValueChanged, useChannel, PromiseButton, usePromise} from "katnip";
import ContentEditor from "katnip/packages/katnip-pages/components/ContentEditor.jsx";
import {BsInput} from "katnip";
import {useState, useContext} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

function BlogProperties({form}) {
	let blog=form.getCurrent();

	let url;
	if (blog.slug)
		url=window.location.origin+"/blog/"+blog.slug;

	if (url && blog.status=="draft")
		url=buildUrl(url,{code: blog.draftCode});

	/*console.log(blog);
	console.log(url);*/

	let urlStyle={
		"white-space": "nowrap",
		"overflow": "hidden",
		"text-overflow": "ellipsis",
		display: "block",
		direction: "rtl"
	};

	return <>
		<div class="mb-3"><b>Document</b></div>
		<div class="form-group mb-3">
			<label class="form-label mb-1">Title</label>
			<BsInput {...form.field("title")} />
		</div>
		<div class="form-group mb-3">
			<label class="form-label mb-1">Status</label>
			<BsInput type="select" {...form.field("status")}
					options={{"": "Published", "draft":"Draft"}}/>
		</div>
		{url &&
			<div class="form-group mb-3">
				<label class="form-label mb-0">Permalink</label>
				<A style={urlStyle} href={url}>{url}</A>
			</div>
		}
		<div class="form-group mb-3">
			<label class="form-label mb-1">Publication Date</label>
			<BsInput type="date" {...form.field("day")}/>
		</div>
	</>;
}


function BlogEdit({request}) {
	async function read() {
		let data={content: [], title: "New Blog Entry", day: dayjs().format("YYYY-MM-DD")};

		if (request.query.id) {
			data=await apiFetch("/api/blog/get",{id: request.query.id});
			data.day=dayjs.unix(data.stamp).format("YYYY-MM-DD");
		}

		return data;
	}

	async function write(data) {
		data.stamp=dayjs(data.day).unix();

		let saved=await apiFetch("/api/blog/save",data);
		setLocation(buildUrl("/admin/blog",{id: saved.id}));
		return saved;
	}

	return (
		<ContentEditor
				saveLabel={request.query.id?"Update Blog Entry":"Create New Blog Entry"}
				metaEditor={BlogProperties} 
				read={read}
				write={write}
				deps={[request.query.id]}/>
	);
}

function BlogAdminList({request}) {
	function formatStamp(item) {
		return dayjs.unix(item.stamp).from(dayjs());
	}

	let columns={
		title: {label: "Title"},
		stamp: {label: "Date", cb: formatStamp},
		status: {label: "Status"}
	};

	async function getBlogs() {
		return await apiFetch("/api/blog/list");
	}

	async function onDelete(id) {
		await apiFetch("/api/blog/delete",{id: id});
		return "Blog entry deleted.";
	}

	return (
		<>
			<div>
				<h1 class="d-inline-block mb-3">Blog Entries</h1>
				<A class="btn btn-outline-primary align-text-bottom ms-2 btn-sm"
						href="/admin/blog?new=1">
					Add Blog Entry
				</A>
			</div>
			<ItemList
					items={getBlogs} 
					columns={columns}
					href="/admin/blog"
					ondelete={onDelete}/>
		</>
	);
}

export default function BlogAdmin({request}) {
	if (request.query.id || request.query.new)
		return <BlogEdit request={request}/>

	return <BlogAdminList request={request}/>
}
