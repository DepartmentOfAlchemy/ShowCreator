use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    sync::{Mutex, MutexGuard},
};
use tauri::{AppHandle, Manager, State};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Controller {
    id: u64,
    name: String,
    description: String,
    manufacturer: String,
    model: String,
    version: String,
    outputs: Vec<String>,
    inputs: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ControllerData {
    name: String,
    description: String,
    manufacturer: String,
    model: String,
    version: String,
    outputs: Vec<String>,
    inputs: Vec<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ControllerUpdate {
    name: Option<String>,
    description: Option<String>,
    manufacturer: Option<String>,
    model: Option<String>,
    version: Option<String>,
    outputs: Option<Vec<String>>,
    inputs: Option<Vec<String>>,
}

#[derive(Default)]
struct ControllerStore(Mutex<()>);

fn store_lock(store: &ControllerStore) -> Result<MutexGuard<'_, ()>, String> {
    store
        .0
        .lock()
        .map_err(|error| format!("Failed to lock controller data: {error}"))
}

fn controllers_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve application data directory: {error}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|error| format!("Failed to create application data directory: {error}"))?;

    Ok(app_data_dir.join("controllers.json"))
}

fn initial_controllers() -> Vec<Controller> {
    vec![Controller {
        id: 1,
        name: "Codex 43".into(),
        description: "Controller with 4 SSO outputs and 3 digitally isolated inputs".into(),
        manufacturer: "Department of Alchemy".into(),
        model: "Codex 43".into(),
        version: "B".into(),
        outputs: vec![
            "Analog".into(),
            "Analog".into(),
            "Analog".into(),
            "Analog".into(),
        ],
        inputs: vec!["Digital".into(), "Digital".into(), "Digital".into()],
    }]
}

fn load_controllers(
    path: &PathBuf,
    legacy_controllers_json: Option<&str>,
) -> Result<Vec<Controller>, String> {
    if !path.exists() {
        let initial = match legacy_controllers_json {
            Some(contents) => serde_json::from_str(contents)
                .map_err(|error| format!("Failed to parse existing controller data: {error}"))?,
            None => initial_controllers(),
        };
        save_controllers(path, &initial)?;
        return Ok(initial);
    }

    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Failed to read controller data: {error}"))?;
    serde_json::from_str(&contents)
        .map_err(|error| format!("Failed to parse controller data: {error}"))
}

fn save_controllers(path: &PathBuf, controllers: &[Controller]) -> Result<(), String> {
    let contents = serde_json::to_string_pretty(controllers)
        .map_err(|error| format!("Failed to serialize controller data: {error}"))?;
    let temporary_path = path.with_extension("json.tmp");

    fs::write(&temporary_path, contents)
        .map_err(|error| format!("Failed to write controller data: {error}"))?;
    fs::rename(&temporary_path, path)
        .map_err(|error| format!("Failed to replace controller data: {error}"))
}

#[tauri::command]
fn get_controllers(
    app: AppHandle,
    store: State<'_, ControllerStore>,
    legacy_controllers_json: Option<String>,
) -> Result<Vec<Controller>, String> {
    let _guard = store_lock(&store)?;
    load_controllers(&controllers_path(&app)?, legacy_controllers_json.as_deref())
}

#[tauri::command]
fn get_controller(
    controller_id: u64,
    app: AppHandle,
    store: State<'_, ControllerStore>,
) -> Result<Controller, String> {
    let _guard = store_lock(&store)?;
    load_controllers(&controllers_path(&app)?, None)?
        .into_iter()
        .find(|controller| controller.id == controller_id)
        .ok_or_else(|| "Controller not found".into())
}

#[tauri::command]
fn create_controller(
    data: ControllerData,
    app: AppHandle,
    store: State<'_, ControllerStore>,
) -> Result<Controller, String> {
    let _guard = store_lock(&store)?;
    let path = controllers_path(&app)?;
    let mut controllers = load_controllers(&path, None)?;
    let controller = Controller {
        id: controllers
            .iter()
            .map(|controller| controller.id)
            .max()
            .unwrap_or(0)
            .checked_add(1)
            .ok_or_else(|| "Controller ID limit reached".to_owned())?,
        name: data.name,
        description: data.description,
        manufacturer: data.manufacturer,
        model: data.model,
        version: data.version,
        outputs: data.outputs,
        inputs: data.inputs,
    };

    controllers.push(controller.clone());
    save_controllers(&path, &controllers)?;
    Ok(controller)
}

#[tauri::command]
fn update_controller(
    controller_id: u64,
    data: ControllerUpdate,
    app: AppHandle,
    store: State<'_, ControllerStore>,
) -> Result<Controller, String> {
    let _guard = store_lock(&store)?;
    let path = controllers_path(&app)?;
    let mut controllers = load_controllers(&path, None)?;
    let controller = controllers
        .iter_mut()
        .find(|controller| controller.id == controller_id)
        .ok_or_else(|| "Controller not found".to_owned())?;

    if let Some(name) = data.name {
        controller.name = name;
    }
    if let Some(description) = data.description {
        controller.description = description;
    }
    if let Some(manufacturer) = data.manufacturer {
        controller.manufacturer = manufacturer;
    }
    if let Some(model) = data.model {
        controller.model = model;
    }
    if let Some(version) = data.version {
        controller.version = version;
    }
    if let Some(outputs) = data.outputs {
        controller.outputs = outputs;
    }
    if let Some(inputs) = data.inputs {
        controller.inputs = inputs;
    }

    let updated_controller = Controller {
        id: controller.id,
        name: controller.name.clone(),
        description: controller.description.clone(),
        manufacturer: controller.manufacturer.clone(),
        model: controller.model.clone(),
        version: controller.version.clone(),
        outputs: controller.outputs.clone(),
        inputs: controller.inputs.clone(),
    };
    save_controllers(&path, &controllers)?;
    Ok(updated_controller)
}

#[tauri::command]
fn delete_controller(
    controller_id: u64,
    app: AppHandle,
    store: State<'_, ControllerStore>,
) -> Result<(), String> {
    let _guard = store_lock(&store)?;
    let path = controllers_path(&app)?;
    let mut controllers = load_controllers(&path, None)?;
    controllers.retain(|controller| controller.id != controller_id);
    save_controllers(&path, &controllers)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ControllerStore::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_controllers,
            get_controller,
            create_controller,
            update_controller,
            delete_controller
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
